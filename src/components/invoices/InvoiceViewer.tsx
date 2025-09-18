import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLicense } from '../../contexts/LicenseContext';
import { Invoice } from '../../contexts/DataContext';
import TemplateRenderer from '../templates/TemplateRenderer';
import ProTemplateModal from '../license/ProTemplateModal';
import { useNavigate } from 'react-router-dom';

import { X, Download, Edit, Printer, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface InvoiceViewerProps {
  invoice: Invoice;
  onClose: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onUpgrade?: () => void;
}

export default function InvoiceViewer({ invoice, onClose, onEdit, onDownload, onUpgrade }: InvoiceViewerProps) {
  const { user } = useAuth();
  const { licenseType } = useLicense();
  const navigate = useNavigate();

  const [selectedTemplate, setSelectedTemplate] = React.useState(user?.company?.defaultTemplate || 'template1');
  const [showProModal, setShowProModal] = React.useState(false);
                                                            
   const [includeSignature, setIncludeSignature] = React.useState(false);
   const [showSignatureModal, setShowSignatureModal] = useState(false);
   const [showProSignatureModal, setShowProSignatureModal] = useState(false); // ✅ Modal spécial pour signature PRO
 
   const templates = [
     { id: 'template1', name: 'Classique', isPro: false },
     { id: 'template2', name: 'Moderne Coloré', isPro: true },
     { id: 'template3', name: 'Minimaliste', isPro: true },
     { id: 'template4', name: 'Corporate', isPro: true },
     { id: 'template5', name: 'Premium Élégant', isPro: true }
   ];
 
   const getTemplateName = (templateId: string) => {
     return templates.find(t => t.id === templateId)?.name || 'Template';
   };
 
   const isTemplateProOnly = (templateId: string) => {
     return templates.find(t => t.id === templateId)?.isPro || false;
   };
 
   const handlePrint = () => {
     if (isTemplateProOnly(selectedTemplate) && licenseType !== 'pro') {
       setShowProModal(true);
       return;
     }
-    generatePDFWithTemplate();
+    void generatePDFWithTemplate();
   };
 
   const handleDownloadPDF = () => {
     if (isTemplateProOnly(selectedTemplate) && licenseType !== 'pro') {
       setShowProModal(true);
       return;
     }
-    generatePDFWithTemplate();
+    void generatePDFWithTemplate();
   };
 
-  const generatePDFWithTemplate = () => {
+  const generatePDFWithTemplate = async () => {
     const invoiceContent = document.getElementById('invoice-content');
     if (!invoiceContent) {
       alert('Erreur: Contenu de la facture non trouvé');
       return;
     }
 
+    const templateRoot = invoiceContent.firstElementChild as HTMLElement | null;
+    if (!templateRoot) {
+      alert('Erreur: Modèle de facture introuvable');
+      return;
+    }
+
     const options = {
       margin: [5, 5, 5, 5],
       filename: `Facture_${invoice.number}.pdf`,
       image: { type: 'jpeg', quality: 0.98 },
       html2canvas: {
         scale: 2,
         useCORS: true,
         allowTaint: false,
         logging: false,
         backgroundColor: '#ffffff',
         width: 794,
         height: 1124
       },
       jsPDF: {
         unit: 'mm',
         format: 'a4',
         orientation: 'portrait'
-      }
+      },
+      pagebreak: { mode: ['css', 'legacy'] as const }
     };
 
-    html2pdf()
-      .set(options)
-      .from(invoiceContent)
-      .save()
-      .catch((error) => {
-        console.error('Erreur lors de la génération du PDF:', error);
-        alert('Erreur lors de la génération du PDF');
+    const buildPdfWrapper = (extraBuffer = 0) => {
+      const itemsSection = templateRoot.querySelector('[data-invoice-section="items"]') as HTMLElement | null;
+      if (!itemsSection) {
+        throw new Error('Section des articles introuvable pour le modèle sélectionné.');
+      }
+
+      const footerSection = templateRoot.querySelector('[data-invoice-section="footer"]') as HTMLElement | null;
+      const totalsSection = templateRoot.querySelector('[data-invoice-section="totals"]') as HTMLElement | null;
+      const signatureSection = templateRoot.querySelector('[data-invoice-section="signature"]') as HTMLElement | null;
+
+      const invoiceRect = templateRoot.getBoundingClientRect();
+      const itemsRect = itemsSection.getBoundingClientRect();
+      const footerRect = footerSection?.getBoundingClientRect();
+
+      const tableHeader = itemsSection.querySelector('thead') as HTMLElement | null;
+      const tableHeaderHeight = tableHeader ? tableHeader.getBoundingClientRect().height : 0;
+
+      const totalsHeight = totalsSection ? totalsSection.getBoundingClientRect().height : 0;
+      const signatureHeight = signatureSection ? signatureSection.getBoundingClientRect().height : 0;
+
+      const pageWidth = invoiceRect.width;
+      const pageHeight = invoiceRect.height;
+
+      const rowElements = Array.from(itemsSection.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
+      const rowHeights = rowElements.map((row) => row.getBoundingClientRect().height);
+      const minimumRowHeight = rowHeights.length ? Math.min(...rowHeights) : 80;
+
+      const headerHeight = itemsRect.top - invoiceRect.top;
+      const footerHeight = footerRect ? invoiceRect.bottom - footerRect.top : 0;
+
+      const bodyAvailable = pageHeight - headerHeight - footerHeight - extraBuffer;
+      const rawStandardCapacity = bodyAvailable - tableHeaderHeight;
+      const standardCapacity = rawStandardCapacity > 0 ? rawStandardCapacity : minimumRowHeight;
+      let lastPageCapacity = bodyAvailable - tableHeaderHeight - totalsHeight - signatureHeight;
+      if (lastPageCapacity < 0) {
+        lastPageCapacity = 0;
+      }
+      if (lastPageCapacity > standardCapacity) {
+        lastPageCapacity = standardCapacity;
+      }
+
+      const pages: number[][] = [];
+
+      if (!rowHeights.length) {
+        pages.push([]);
+      } else {
+        let currentRows: number[] = [];
+        let currentHeight = 0;
+
+        rowHeights.forEach((height, index) => {
+          if (!currentRows.length) {
+            currentRows.push(index);
+            currentHeight = height;
+            return;
+          }
+
+          if (currentHeight + height <= standardCapacity) {
+            currentRows.push(index);
+            currentHeight += height;
+          } else {
+            pages.push(currentRows);
+            currentRows = [index];
+            currentHeight = height;
+          }
+        });
+
+        if (currentRows.length) {
+          pages.push(currentRows);
+        }
+      }
+
+      if (!pages.length) {
+        pages.push([]);
+      }
+
+      const sumHeight = (rows: number[]) => rows.reduce((total, idx) => total + (rowHeights[idx] || 0), 0);
+
+      if (rowHeights.length && pages.length) {
+        if (lastPageCapacity <= 0) {
+          const finalRows = pages[pages.length - 1];
+          if (finalRows.length) {
+            const movedRows = finalRows.splice(0, finalRows.length);
+            if (pages.length === 1) {
+              pages.splice(0, 0, movedRows);
+            } else {
+              pages.splice(pages.length - 1, 0, movedRows);
+            }
+          }
+        } else {
+          let safety = 0;
+          while (sumHeight(pages[pages.length - 1]) > lastPageCapacity && pages[pages.length - 1].length > 1 && safety < 50) {
+            const finalIndex = pages.length - 1;
+            const finalRows = pages[finalIndex];
+            const overflowRows: number[] = [];
+
+            while (finalRows.length > 1 && sumHeight(finalRows) > lastPageCapacity) {
+              const moved = finalRows.shift();
+              if (typeof moved === 'number') {
+                overflowRows.push(moved);
+              }
+            }
+
+            if (!overflowRows.length) {
+              break;
+            }
+
+            pages.splice(finalIndex, 0, overflowRows);
+            safety += 1;
+          }
+        }
+      }
+
+      const structuredPages = pages.length ? pages : [[]];
+
+      const wrapper = document.createElement('div');
+      wrapper.className = 'invoice-pdf-wrapper';
+      wrapper.style.position = 'fixed';
+      wrapper.style.top = '0';
+      wrapper.style.left = '-10000px';
+      wrapper.style.width = `${pageWidth}px`;
+      wrapper.style.pointerEvents = 'none';
+      wrapper.style.opacity = '0';
+      wrapper.style.zIndex = '-1';
+
+      structuredPages.forEach((rowIndexes, index) => {
+        const pageClone = templateRoot.cloneNode(true) as HTMLElement;
+        pageClone.classList.add('invoice-page');
+        pageClone.style.width = `${pageWidth}px`;
+        pageClone.style.maxWidth = `${pageWidth}px`;
+        pageClone.style.minHeight = `${pageHeight}px`;
+        pageClone.style.boxSizing = 'border-box';
+        pageClone.style.margin = '0 auto';
+        pageClone.style.display = 'flex';
+        pageClone.style.flexDirection = 'column';
+
+        if (index < structuredPages.length - 1) {
+          pageClone.setAttribute('data-html2pdf-pagebreak', 'after');
+          pageClone.style.pageBreakAfter = 'always';
+          (pageClone.style as CSSStyleDeclaration).breakAfter = 'page';
+        } else {
+          pageClone.setAttribute('data-html2pdf-pagebreak', 'avoid');
+          pageClone.style.pageBreakAfter = 'avoid';
+          (pageClone.style as CSSStyleDeclaration).breakAfter = 'auto';
+        }
+
+        const itemsClone = pageClone.querySelector('[data-invoice-section="items"]');
+        if (itemsClone) {
+          const rowSet = new Set(rowIndexes);
+          const clonedRows = Array.from(itemsClone.querySelectorAll('tbody tr'));
+          clonedRows.forEach((row, idx) => {
+            if (!rowSet.has(idx)) {
+              row.remove();
+            }
+          });
+        }
+
+        if (index !== structuredPages.length - 1) {
+          pageClone.querySelectorAll('[data-invoice-section="totals"]').forEach((node) => node.remove());
+          pageClone.querySelectorAll('[data-invoice-section="signature"]').forEach((node) => node.remove());
+        }
+
+        wrapper.appendChild(pageClone);
       });
+
+      return { wrapper, pageCount: structuredPages.length || 1 };
+    };
+
+    const maxAttempts = 4;
+
+    const generateWithBuffer = async (buffer = 0, attempt = 1): Promise<void> => {
+      const { wrapper, pageCount } = buildPdfWrapper(buffer);
+      document.body.appendChild(wrapper);
+
+      const worker = html2pdf().set(options).from(wrapper).toPdf();
+
+      try {
+        const pdfInstance = await worker.get('pdf');
+        const generatedPages = pdfInstance.internal.getNumberOfPages();
+
+        if (generatedPages !== pageCount && attempt < maxAttempts) {
+          const nextBuffer = buffer + 20;
+          console.warn(`Ajustement du découpage PDF (tentative ${attempt})`, {
+            attendu: pageCount,
+            genere: generatedPages,
+            margeSupplementaire: nextBuffer
+          });
+          return generateWithBuffer(nextBuffer, attempt + 1);
+        }
+
+        if (generatedPages !== pageCount) {
+          console.warn(`Nombre de pages attendu (${pageCount}) différent du PDF généré (${generatedPages}).`);
+        }
+
+        await worker.save();
+      } finally {
+        wrapper.remove();
+      }
+    };
+
+    try {
+      await generateWithBuffer();
+    } catch (error) {
+      console.error('Erreur lors de la génération du PDF:', error);
+      alert('Erreur lors de la génération du PDF');
+    }
   };
 
   return (
     <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
       <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
         <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
           
           {/* Header */}
           <div className="flex items-center justify-between p-6 border-b border-gray-200">
             <h3 className="text-lg font-semibold text-gray-900">
               Facture {invoice.number}
             </h3>
             <div className="flex items-center space-x-3">
               
               {/* Sélecteur Template */}
               <select
                 value={selectedTemplate}
                 onChange={(e) => setSelectedTemplate(e.target.value)}
                 className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
               >
                 <option value="template1">Classic Free</option>
                 <option value="template2">Noir Classique Pro</option>
                 <option value="template3">Moderne avec formes vertes Pro</option>
                 <option value="template4">Bleu Élégant Pro</option>
                 <option value="template5">Minimal Bleu Pro</option>
 
EOF
)