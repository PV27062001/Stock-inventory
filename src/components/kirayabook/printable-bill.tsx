import { forwardRef } from 'react';
import type { PrintableBillView } from '@/lib/printable-bill';

const ROWS = 12;

/** Classic A5 Indian bill-book layout, bilingual Tamil/English. Rendered for print, PDF and JPEG export. */
export const PrintableBill = forwardRef<HTMLDivElement, { bill: PrintableBillView }>(function PrintableBill(
  { bill },
  ref,
) {
  const rows = Math.max(ROWS, bill.items.length);
  const dense = rows > ROWS;

  return (
    <div ref={ref} className="printable-bill mx-auto bg-white text-[#17464c]" data-state={bill.state}>
      <div className="bill-box flex h-full flex-col border-[1.5px] border-current">
        <header className="shrink-0 px-[2mm] pb-[1mm] pt-[1mm] text-center">
          <p className={`${dense ? 'text-[17px]' : 'text-[19px]'} m-0 mb-[0.5mm] mt-[1mm] font-extrabold leading-tight text-[#b42724]`}>
            {bill.shop.nameTa}
          </p>
          <p className="m-0 text-[11px] font-extrabold text-[#b42724]">{bill.shop.name}</p>
          <p className="mt-[1.5mm] text-[8px]">{bill.shop.taglineTa}</p>
          <p className="mt-[1mm] text-[7px]">{bill.shop.tagline}</p>
          {bill.shop.address && <p className="mt-[1.8mm] text-[8px]">{bill.shop.address}</p>}
          {bill.shop.phone && <p className="mt-[1.2mm] text-[9px] font-bold">{bill.shop.phone}</p>}
        </header>

        <div className="flex shrink-0 items-center justify-between gap-[2mm] border-y border-current px-[2mm] py-[1.6mm]">
          <div className="flex items-center gap-[2mm]">
            <div className="text-[9px] font-semibold leading-snug">
              பில் எண்
              <small className="block text-[7px] font-medium">Bill No</small>
            </div>
            <span className="text-[16px] font-extrabold text-[#b42724]">#{bill.billNo}</span>
          </div>
          <div className="text-center text-[11px] font-extrabold">வாடகை பில்</div>
          <div className="flex items-center gap-[2mm]">
            <div className="text-[9px] font-semibold leading-snug">
              தேதி
              <small className="block text-[7px] font-medium">Date</small>
            </div>
            <span className="text-[10px] font-semibold">{bill.billDate}</span>
          </div>
        </div>

        <section className="grid shrink-0 gap-[1.3mm] px-[2mm] py-[2mm]">
          <div className="flex gap-[3mm]">
            <Field label="பெயர்" labelEn="Name" value={bill.customer.name} />
            <Field label="கைபேசி" labelEn="Cell" value={bill.customer.mobile} grow={0.65} />
          </div>
          <div className="flex gap-[3mm]">
            <Field label="வேலை" labelEn="Work" value={bill.customer.profession} />
          </div>
          <div className="flex gap-[3mm]">
            <Field label="முதல்" labelEn="From" value={bill.from} />
            <Field label="வரை" labelEn="Till" value={bill.till} />
            <Field label="நாட்கள்" labelEn="Days" value={bill.days ?? '—'} grow={0.55} />
          </div>
        </section>

        <table className="w-full shrink-0 table-fixed border-collapse text-[9px] leading-tight">
          <colgroup>
            <col style={{ width: '8%' }} />
            <col style={{ width: '43%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '19%' }} />
          </colgroup>
          <thead>
            <tr className="h-[10mm] border-t border-current">
              <Th ta="வ.எண்" en="S.No" />
              <Th ta="விவரம்" en="Particulars" />
              <Th ta="எண்ணிக்கை" en="Qty" />
              <Th ta="விலை" en="Rate · Rs." />
              <Th ta="தொகை" en="Amount · Rs." />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, i) => bill.items[i]).map((item, i) => (
              <tr key={i} className="border-b border-[#5b8588]" style={{ height: `${54 / rows}mm` }}>
                <Td align="center">{item ? item.sno : ''}</Td>
                <Td className="text-left">{item?.name ?? ''}</Td>
                <Td align="center">{item ? item.quantity.toLocaleString('en-IN') : ''}</Td>
                <Td align="right">{item ? item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}</Td>
                <Td align="right" last>
                  {item ? item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="grid min-h-[32mm] flex-1 grid-cols-[1fr_49mm]">
          <div className="relative flex min-w-0 flex-col gap-[1.5mm] p-[2mm]">
            <div className="text-[8px] font-semibold leading-snug">
              அட்சரத்தில்
              <small className="block text-[7px] font-medium">Amount in words</small>
            </div>
            <div className="max-w-[95%] text-[8px] leading-tight">{bill.amountInWords}</div>
            <div
              className={`stamp ml-[5mm] mt-[1mm] self-start rotate-[-9deg] border-[3px] border-double px-[3mm] py-[1mm] text-center text-[13px] font-extrabold leading-tight opacity-80 ${stampColor(bill.state)}`}
            >
              <span className="block text-[8px]">{bill.stampLabel.ta}</span>
              {bill.stampLabel.en}
            </div>
          </div>
          <div className="flex flex-col border-l border-current">
            <TotalRow label="மொத்தம்" labelEn="Total" value={bill.total} />
            <TotalRow label="முன்பணம்" labelEn="Less Advance" value={bill.advance} />
            <div className="flex min-h-[8mm] flex-1 items-center justify-between gap-[1mm] px-[2mm] py-[1.5mm]">
              <div className="text-[8px] font-semibold leading-snug">
                {bill.finalLabel.ta}
                <small className="block text-[7px] font-medium">{bill.finalLabel.en}</small>
              </div>
              <span className="whitespace-nowrap text-[13px] font-extrabold tabular-nums">{bill.finalAmount}</span>
            </div>
          </div>
        </section>

        {bill.damageNotes && (
          <div className="flex shrink-0 items-center gap-[2mm] border-t border-current px-[2mm] py-[1mm] text-[8px]">
            <div className="font-semibold leading-snug">
              சேத குறிப்பு
              <small className="block text-[7px] font-medium">Damage Note</small>
            </div>
            <span>{bill.damageNotes}</span>
          </div>
        )}

        <footer className="flex min-h-[13mm] shrink-0 items-end justify-between border-t border-current p-[2mm]">
          <div className="self-end text-[7px]">{bill.shop.name}</div>
          <div className="min-w-[47mm] text-center">
            <div className="mb-[1mm] h-[2mm] w-[40mm] border-b border-dotted border-current" />
            <div className="text-[9px] font-semibold leading-snug">
              கையொப்பம்
              <small className="block text-[7px] font-medium">Signature</small>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
});

function Field({
  label,
  labelEn,
  value,
  grow = 1,
}: {
  label: string;
  labelEn: string;
  value: string | number;
  grow?: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-[2mm]" style={{ flex: grow }}>
      <div className="shrink-0 text-[9px] font-semibold leading-snug">
        {label}
        <small className="block text-[7px] font-medium">{labelEn}</small>
      </div>
      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap border-b border-dotted border-[#5b8588] text-[10px] leading-[1.7]">
        {value}
      </span>
    </div>
  );
}

function Th({ ta, en }: { ta: string; en: string }) {
  return (
    <th className="border-b border-current border-r border-current px-[1.5mm] text-center font-semibold last:border-r-0">
      <div className="text-[9px] leading-snug">
        {ta}
        <small className="block text-[7px] font-medium">{en}</small>
      </div>
    </th>
  );
}

function Td({
  children,
  align = 'left',
  className = '',
  last = false,
}: {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  last?: boolean;
}) {
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right tabular-nums' : 'text-left';
  return (
    <td className={`${!last ? 'border-r border-current' : ''} px-[1.5mm] align-middle ${alignClass} ${className}`}>
      {children}
    </td>
  );
}

function TotalRow({ label, labelEn, value }: { label: string; labelEn: string; value: string }) {
  return (
    <div className="flex min-h-[8mm] items-center justify-between gap-[1mm] border-b border-[#5b8588] px-[2mm] py-[1.5mm]">
      <div className="text-[8px] font-semibold leading-snug">
        {label}
        <small className="block text-[7px] font-medium">{labelEn}</small>
      </div>
      <span className="whitespace-nowrap text-[11px] font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function stampColor(state: PrintableBillView['state']) {
  switch (state) {
    case 'due':
      return 'text-[#b42724]';
    case 'refund':
    case 'paid':
      return 'text-[#237143]';
    default:
      return 'text-[#94691c]';
  }
}
