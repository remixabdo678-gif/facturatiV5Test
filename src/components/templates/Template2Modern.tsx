import React from 'react';
import { Invoice, Quote } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface TemplateProps {
  data: Invoice | Quote;
  type: 'invoice' | 'quote';
  includeSignature?: boolean;
}

export default function Template2Modern({ data, type, includeSignature = false }: TemplateProps) {
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
            margin-top: 180px;
            margin-bottom: 100px;
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
        <div className="pdf-header bg-black text-white p-6">
          <div className="flex items-center justify-between">
            {user?.company.logo && (
              <img
                src={user.company.logo}
                alt="Logo"
                className="h-20 w-auto"
              />
            )}
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-extrabold">{user?.company.name}</h2>
              <h1 className="text-xl font-bold mt-2">{title}</h1>
            </div>
            <div className="text-right text-sm">
              <p><strong>N°:</strong> {data.number}</p>
              <p><strong>Date:</strong> {new Date(data.date).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="pdf-content flex-1">
          {/* CLIENT + DATES */}
          <div className="p-6 border-b border-gray-300">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded border border-black">
                <h3 className="font-bold text-sm text-black mb-3 border-b border-black pb-2 text-center">
                  CLIENT : {data.client.name}
                </h3>
                <div className="text-sm text-black space-y-1 text-center">
                  <p>{data.client.address}</p>
                  <p><strong>ICE:</strong> {data.client.ice}</p>
                  <p><strong>Tél:</strong> {data.client.phone}</p>
                  <p><strong>Email:</strong> {data.client.email}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-black">
                <h3 className="font-bold text-sm text-black mb-3 border-b border-black pb-2 text-center">
                  INFORMATIONS
                </h3>
                <div className="text-sm text-black text-center space-y-1">
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
            <table className="pdf-table w-full border-collapse border border-black">
              <thead className="bg-black text-white">
                <tr>
                  <th className="border border-white px-3 py-2 text-center font-bold text-sm">DÉSIGNATION</th>
                  <th className="border border-white px-3 py-2 text-center font-bold text-sm">QUANTITÉ</th>
                  <th className="border border-white px-3 py-2 text-center font-bold text-sm">P.U. HT</th>
                  <th className="border border-white px-3 py-2 text-center font-bold text-sm">TOTAL HT</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black px-3 py-2 text-center text-sm">{item.description}</td>
                    <td className="border border-black px-3 py-2 text-center text-sm">
                      {item.quantity.toFixed(3)} {item.unit || 'unité'}
                    </td>
                    <td className="border border-black px-3 py-2 text-center text-sm">
                      {item.unitPrice.toFixed(2)} MAD
                    </td>
                    <td className="border border-black px-3 py-2 text-center font-medium text-sm">
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
              {/* Bloc gauche */}
              <div className="w-80 bg-gray-50 border border-black rounded p-4">
                <p className="text-sm font-bold text-center mb-2">
                  Arrêtée la présente {type === 'invoice' ? 'facture' : 'devis'} à la somme de :
                </p>
                <p className="text-sm text-gray-700">• {data.totalInWords}</p>
              </div>

              {/* Bloc droit */}
              <div className="w-80 bg-gray-50 border border-black rounded p-4">
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
                  
                  <div className="flex justify-between text-sm font-bold border-t border-black pt-2">
                    <span>TOTAL TTC:</span>
                    <span>{data.totalTTC.toFixed(2)} MAD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURE - Éviter la coupure */}
          <div className="pdf-signature p-6">
            <div className="flex justify-start">
              <div className="w-60 bg-gray-50 border border-black rounded p-4 text-center">
                <div className="text-sm font-bold mb-3">Signature</div>
                <div className="border-2 border-black rounded h-20 flex items-center justify-center">
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
        <div className="pdf-footer bg-black text-white p-4 text-center text-xs">
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