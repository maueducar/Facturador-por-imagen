
import React from 'react';
import { Invoice } from '../types';
import { UserIcon, ListIcon, NoteIcon } from './icons';

interface InvoiceDisplayProps {
  invoice: Invoice;
}

const Card: React.FC<{ children: React.ReactNode; title: string; icon: React.ReactNode }> = ({ children, title, icon }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg w-full">
    <div className="p-4 border-b border-gray-700 flex items-center space-x-3">
        {icon}
        <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
    </div>
    <div className="p-4">
        {children}
    </div>
  </div>
);

const InvoiceDisplay: React.FC<InvoiceDisplayProps> = ({ invoice }) => {
  const { client, items, concepts } = invoice;

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '$ -';
    return amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  };
  
  const total = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Client Section */}
      <Card title="Cliente" icon={<UserIcon className="w-6 h-6 text-blue-400" />}>
        {client.name || client.id || client.address ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-300">
            <div><strong>Nombre:</strong> {client.name || <span className="text-gray-500">No especificado</span>}</div>
            <div><strong>ID/CUIT:</strong> {client.id || <span className="text-gray-500">No especificado</span>}</div>
            <div className="col-span-2"><strong>Dirección:</strong> {client.address || <span className="text-gray-500">No especificado</span>}</div>
          </div>
        ) : <p className="text-gray-500">Aún no se han cargado datos del cliente.</p>}
      </Card>

      {/* Items Section */}
      <Card title="Artículos" icon={<ListIcon className="w-6 h-6 text-green-400" />}>
        {items.length > 0 ? (
          <div className="flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-300 sm:pl-0">Descripción</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Cant.</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">P. Unitario</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-300 sm:pl-0">{item.description}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{item.quantity}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{formatCurrency(item.unitPrice)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{formatCurrency(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                        <th scope="row" colSpan={3} className="text-right pr-3 pt-4 font-semibold text-gray-200">Total</th>
                        <td className="pl-3 pt-4 font-semibold text-lg text-green-400">{formatCurrency(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        ) : <p className="text-gray-500">Aún no se han agregado artículos.</p>}
      </Card>

      {/* Concepts Section */}
      {concepts && (
        <Card title="Conceptos Adicionales" icon={<NoteIcon className="w-6 h-6 text-yellow-400" />}>
          <p className="text-gray-400 whitespace-pre-wrap">{concepts}</p>
        </Card>
      )}
    </div>
  );
};

export default InvoiceDisplay;
