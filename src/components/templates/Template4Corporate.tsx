import React from 'react';
import { Invoice, Quote } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface TemplateProps {
  data: Invoice | Quote;
  type: 'invoice' | 'quote';
  includeSignature?: boolean;
}

export default function Template4Corporate({ data, type, includeSignature = false }: TemplateProps) {
  const { user } = useAuth();

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
            margin-top: 220px;
            margin-bottom: 140px;
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
          
          .wave-decoration {
            display: none !important;
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
        <div className="pdf-header relative bg-blue-800 text-white p-6">
          <div className="flex items-center justify-between">
            {user?.company.logo && (
              <img
                src={user.company.logo}
                alt="Logo"
                className="h-20 w-auto"
              />
            )}
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-extrabold uppercase tracking-wide">
                {user?.company.name}
              </h1>
              <h2 className="text-xl font-semibold mt-2 tracking-widest">
                {type === 'invoice' ? 'FACTURE' : 'DEVIS'}
              </h2>
            </div>
            <div className="text-right text-sm">
              <p><strong>N°:</strong> {data.number}</p>
              <p><strong>Date:</strong> {new Date(data.date).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Vague blanche en bas - masquée en PDF */}
          <svg
            className="wave-decoration absolute bottom-0 left-0 w-full h-8"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,48 C180,96 360,12 540,60 C720,108 900,36 1080,84 C1260,120 1440,72 1440,72 L1440,120 L0,120 Z"
              fill="#ffffff"
            />
          </svg>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="pdf-content flex-1">
          {/* CLIENT + DATES */}
          <div className="p-6 border-b border-blue-800">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded border border-blue-800">
                <h3 className="font-bold text-sm text-blue-800 mb-3 border-b border-blue-800 pb-2 text-center">
                  CLIENT : {data.client.name}
                </h3>
                <div className="text-sm text-black space-y-1 text-center">
                  <p>{data.client.address}</p>
                  <p><strong>ICE:</strong> {data.client.ice}</p>
                  <p><strong>Tél:</strong> {data.client.phone}</p>
                  <p><strong>Email:</strong> {data.client.email}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-blue-800">
                <h3 className="font-bold text-sm text-blue-800 mb-3 border-b border-blue-800 pb-2 text-center">
                  INFORMATIONS
                </h3>
                <div className="text-sm text-black space-y-1 text-center">
                  <p><strong>{type === 'invoice' ? 'FACTURE' : 'DEVIS'} N°:</strong> {data.number}</p>
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
            <table className="pdf-table w-full border-collapse border border-blue-800">
              <thead className="bg-blue-800 text-white">
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
                    <td className="border border-blue-800 px-3 py-2 text-center text-sm">{item.description}</td>
                    <td className="border border-blue-800 px-3 py-2 text-center text-sm">
                      {item.quantity.toFixed(3)} {item.unit || 'unité'}
                    </td>
                    <td className="border border-blue-800 px-3 py-2 text-center text-sm">
                      {item.unitPrice.toFixed(2)} MAD
                    </td>
                    <td className="border border-blue-800 px-3 py-2 text-center font-medium text-sm">
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
              <div className="w-80 bg-gray-50 rounded border border-blue-800 p-4">
                <div className="text-sm font-bold text-center text-blue-800 pb-2">
                  <p>Arrêtée la présente {type === 'invoice' ? 'facture' : 'devis'} à la somme de :</p>
                </div>
                <div className="border-t border-blue-800 pt-2">
                  <p className="text-sm font-bold text-blue-800">• {data.totalInWords}</p>
                </div>
              </div>

              {/* Bloc droit */}
              <div className="w-80 bg-gray-50 rounded border border-blue-800 p-4">
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
                  
                  <div className="flex justify-between text-sm font-bold border-t border-blue-800 pt-2">
                    <span>TOTAL TTC:</span>
                    <span className="text-blue-800">{data.totalTTC.toFixed(2)} MAD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURE - Éviter la coupure */}
          <div className="pdf-signature p-6">
            <div className="flex justify-start">
              <div className="w-60 bg-gray-50 border border-blue-800 rounded p-4 text-center">
                <div className="text-sm font-bold mb-3">Signature</div>
                <div className="border-2 border-blue-800 rounded h-20 flex items-center justify-center">
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
        <div className="pdf-footer relative bg-blue-800 text-white">
          {/* Vague blanche en haut - masquée en PDF */}
          <svg
            className="wave-decoration absolute top-0 left-0 w-full h-8"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,0 L0,48 C180,72 360,12 540,48 C720,84 900,24 1080,60 C1260,96 1440,36 1440,36 L1440,0 Z"
              fill="#ffffff"
            />
          </svg>

          <div className="p-4 text-center text-xs relative z-10">
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
      </div>
    </>
  );
}