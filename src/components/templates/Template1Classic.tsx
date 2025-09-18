import React from 'react';
import { Invoice, Quote } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface TemplateProps {
  data: Invoice | Quote;
  type: 'invoice' | 'quote';
  includeSignature?: boolean;
}

export default function Template1Classic({ data, type, includeSignature = false }: TemplateProps) {
  const { user } = useAuth();
  const title = type === 'invoice' ? 'FACTURE' : 'DEVIS';

  return (
    <>
      {/* Styles CSS pour la pagination PDF */}
      <style>{`
        @page {
          size: A4;
          margin: 0;
          @top-center {
            content: element(header);
          }
          @bottom-center {
            content: element(footer);
          }
        }
        
        @media print {
          .pdf-header {
            position: running(header);
            page-break-inside: avoid;
          }
          
          .pdf-footer {
            position: running(footer);
            page-break-inside: avoid;
          }
          
          .pdf-content {
            margin-top: 200px;
            margin-bottom: 120px;
          }
          
          .pdf-table {
            page-break-inside: auto;
          }
          
          .pdf-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          .pdf-table thead {
            display: table-header-group;
          }
          
          .pdf-signature {
            page-break-before: avoid;
            page-break-inside: avoid;
          }
          
          .pdf-totals {
            page-break-before: avoid;
            page-break-inside: avoid;
          }
        }
        
        /* Styles pour l'affichage normal */
        .template-container {
          font-family: Arial, sans-serif;
          width: 100%;
          max-width: 750px;
          min-height: 1100px;
          background: white;
          display: flex;
          flex-direction: column;
        }
      `}</style>

      <div className="template-container">
        {/* HEADER - Sera répété sur chaque page en PDF */}
        <div className="pdf-header bg-white border-b-2 border-gray-300 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-6">
              {user?.company.logo && (
                <img
                  src={user.company.logo}
                  alt="Logo"
                  className="h-16 w-auto"
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.company.name}</h2>
                <p className="text-sm text-gray-600">{user?.company.address}</p>
                <p className="text-sm text-gray-600">{user?.company.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-teal-600">{title}</h1>
              <p className="text-sm"><strong>N°:</strong> {data.number}</p>
              <p className="text-sm"><strong>Date:</strong> {new Date(data.date).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="pdf-content flex-1">
          {/* CLIENT + DATES */}
          <div className="p-6 border-b border-gray-300">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="font-bold text-sm text-gray-900 mb-3 border-b border-gray-300 pb-2 text-center">
                  CLIENT : {data.client.name}
                </h3>
                <div className="text-sm text-gray-700 space-y-1 text-center">
                  <p>{data.client.address}</p>
                  <p><strong>ICE:</strong> {data.client.ice}</p>
                  <p><strong>Tél:</strong> {data.client.phone}</p>
                  <p><strong>Email:</strong> {data.client.email}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="font-bold text-sm text-gray-900 mb-3 border-b border-gray-300 pb-2 text-center">
                  INFORMATIONS
                </h3>
                <div className="text-sm text-gray-700 text-center space-y-1">
                  <p><strong>{title} N°:</strong> {data.number}</p>
                  <p><strong>Date:</strong> {new Date(data.date).toLocaleDateString('fr-FR')}</p>
                  {type === 'quote' && 'validUntil' in data && (
                    <p><strong>Valide jusqu'au:</strong> {new Date(data.validUntil).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TABLE PRODUITS - Avec pagination automatique */}
          <div className="p-6">
            <table className="pdf-table w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-center font-bold text-sm">DÉSIGNATION</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-bold text-sm">QUANTITÉ</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-bold text-sm">P.U. HT</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-bold text-sm">TOTAL HT</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.description}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {item.quantity.toFixed(3)} {item.unit || 'unité'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {item.unitPrice.toFixed(2)} MAD
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium text-sm">
                      {item.total.toFixed(2)} MAD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTAUX - Éviter la coupure */}
          <div className="pdf-totals p-6">
            <div className="flex justify-between">
              {/* Bloc gauche - Montant en lettres */}
              <div className="w-80 bg-gray-50 border border-gray-300 rounded p-4">
                <p className="text-sm font-bold text-center mb-2">
                  Arrêtée la présente {type === 'invoice' ? 'facture' : 'devis'} à la somme de :
                </p>
                <p className="text-sm text-gray-700">• {data.totalInWords}</p>
              </div>

              {/* Bloc droit - Totaux */}
              <div className="w-80 bg-gray-50 border border-gray-300 rounded p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total HT:</span>
                    <span className="font-medium">{data.subtotal.toFixed(2)} MAD</span>
                  </div>
                  
                  {/* TVA détaillée */}
                  {(() => {
                    const vatGroups = data.items.reduce(
                      (acc: Record<number, { amount: number; products: string[] }>, item) => {
                        const vatAmount = (item.unitPrice * item.quantity * item.vatRate) / 100;
                        if (!acc[item.vatRate]) {
                          acc[item.vatRate] = { amount: 0, products: [] };
                        }
                        acc[item.vatRate].amount += vatAmount;
                        acc[item.vatRate].products.push(item.description);
                        return acc;
                      },
                      {}
                    );

                    return Object.keys(vatGroups).map((rate) => (
                      <div key={rate} className="flex justify-between text-sm">
                        <span>TVA {rate}%:</span>
                        <span className="font-medium">{vatGroups[+rate].amount.toFixed(2)} MAD</span>
                      </div>
                    ));
                  })()}
                  
                  <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-2">
                    <span>TOTAL TTC:</span>
                    <span className="text-teal-600">{data.totalTTC.toFixed(2)} MAD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURE - Éviter la coupure */}
          <div className="pdf-signature p-6">
            <div className="flex justify-start">
              <div className="w-60 bg-gray-50 border border-gray-300 rounded p-4 text-center">
                <div className="text-sm font-bold mb-3">Signature</div>
                <div className="border-2 border-gray-300 rounded h-20 flex items-center justify-center">
                  {includeSignature && user?.company?.signature ? (
                    <img
                      src={user.company.signature}
                      alt="Signature"
                      className="max-h-16 max-w-full object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : (
                    <span className="text-gray-400 text-sm"></span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER - Sera répété sur chaque page en PDF */}
        <div className="pdf-footer bg-gray-100 border-t-2 border-gray-300 p-4 text-center text-xs text-gray-600">
          <p>
            <strong>{user?.company.name}</strong> | {user?.company.address} | 
            <strong>Tél:</strong> {user?.company.phone} | 
            <strong>Email:</strong> {user?.company.email} | 
            <strong>ICE:</strong> {user?.company.ice} | 
            <strong>IF:</strong> {user?.company.if} | 
            <strong>RC:</strong> {user?.company.rc} | 
            <strong>CNSS:</strong> {user?.company.cnss} | 
            <strong>Patente:</strong> {user?.company.patente} | 
            <strong>Site:</strong> {user?.company.website}
          </p>
        </div>
      </div>
    </>
  );
}