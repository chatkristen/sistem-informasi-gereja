'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { formatDateIndo } from '@/lib/utils';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

function MemberCardContent() {
  const searchParams = useSearchParams();
  const memberId = searchParams.get('id');

  const [member, setMember] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMember() {
      if (!memberId) return;
      try {
        const res = await fetch(`/api/jemaat/${memberId}`);
        const json = await res.json();
        if (json.success) {
          setMember(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMember();
  }, [memberId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !member) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in print:p-0 print:m-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/jemaat/${member.id}`}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Kembali ke Profil
          </Button>
        </Link>

        <Button variant="gold" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
          Cetak Kartu Jemaat
        </Button>
      </div>

      <div className="text-center space-y-1 print:hidden">
        <h2 className="text-xl font-black text-navy-950">Kartu Tanda Anggota Jemaat Digital</h2>
        <p className="text-xs text-slate-500">
          Kartu identitas resmi keanggotaan Gereja Kristen Kasih Anugerah (GKKA) Jakarta
        </p>
      </div>

      {/* Digital Member Card Frame (CR80 Standard Ratio approx 85.6mm x 53.98mm) */}
      <div className="relative mx-auto w-full max-w-md aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white shadow-2xl p-6 overflow-hidden border border-gold-500/30 flex flex-col justify-between print:shadow-none print:border-navy-900 print:w-[350px]">
        {/* Background Decorative Patterns */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-gold-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-gold-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Card Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 font-black text-lg shrink-0">
              ✝
            </div>
            <div>
              <h3 className="font-extrabold text-xs tracking-tight text-white leading-tight">
                GEREJA KRISTEN KASIH ANUGERAH
              </h3>
              <p className="text-[9px] text-gold-400 font-semibold tracking-wider uppercase">
                Kartu Tanda Anggota Jemaat
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] font-bold text-gold-400 bg-gold-400/10 px-2 py-0.5 rounded border border-gold-400/20">
            GKKA-ID
          </span>
        </div>

        {/* Card Body */}
        <div className="relative z-10 flex items-center gap-4 my-auto py-2">
          <img
            src={member.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
            alt={member.full_name}
            className="w-20 h-20 rounded-xl object-cover border-2 border-gold-400 shadow-md shrink-0"
          />
          <div className="space-y-1 min-w-0">
            <p className="font-mono text-xs font-bold text-gold-300 tracking-wider">
              {member.member_number}
            </p>
            <h4 className="font-black text-base text-white tracking-tight leading-snug truncate">
              {member.full_name}
            </h4>
            <p className="text-[11px] text-navy-200">
              Lahir: {member.pob || '-'}, {formatDateIndo(member.dob)}
            </p>
            <p className="text-[10px] text-navy-300">
              Terdaftar: {formatDateIndo(member.join_date)}
            </p>
          </div>
        </div>

        {/* Card Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2.5 text-[9px] text-navy-300">
          <div>
            <p className="font-semibold text-white">Status: ANGGOTA JEMAAT AKTIF</p>
            <p className="text-[8px] text-navy-400">Jl. Kasih Anugerah No. 7, Jakarta Pusat</p>
          </div>
          <div className="font-mono tracking-widest text-[11px] text-gold-400/80 font-bold">
            ||| | |||| | ||| |||| |
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DigitalMemberCardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
        </div>
      }
    >
      <MemberCardContent />
    </Suspense>
  );
}
