import { NextResponse } from 'next/server';
import { readDatabase } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'SUPER_ADMIN';
    const deptId = searchParams.get('department_id');

    const db = readDatabase();

    // 1. Metric Counts
    const totalJemaat = db.members.filter((m) => m.status === 'ACTIVE').length;
    const totalKeluarga = db.families.filter((f) => f.status === 'ACTIVE').length;
    const totalDepartemen = db.departments.filter((d) => d.status === 'ACTIVE').length;
    const totalPengguna = db.users.filter((u) => u.status === 'ACTIVE').length;

    // 2. Financial Metrics (Actual Current Month)
    const currentMonthPrefix = '2026-11';
    let totalPemasukanBulanIni = 0;
    let totalPengeluaranBulanIni = 0;

    db.financial_transactions.forEach((tx) => {
      if (tx.status === 'REVERSED') return;
      if (tx.transaction_date.startsWith(currentMonthPrefix)) {
        if (tx.type === 'INCOME') totalPemasukanBulanIni += tx.amount;
        if (tx.type === 'EXPENSE') totalPengeluaranBulanIni += tx.amount;
      }
    });

    const saldoKasBank = db.financial_accounts.reduce(
      (sum, acc) => (acc.status === 'ACTIVE' ? sum + acc.current_balance : sum),
      0
    );

    // 3. Upcoming Events
    const now = new Date().toISOString();
    const kegiatanMendatang = db.events
      .filter((e) => e.status === 'SCHEDULED' || e.status === 'ONGOING')
      .slice(0, 5);

    // 4. Finance Trends for Different Periods
    const trendKeuangan6Bulan = [
      { bulan: 'Jun', pemasukan: 42000000, pengeluaran: 28000000 },
      { bulan: 'Jul', pemasukan: 48500000, pengeluaran: 31000000 },
      { bulan: 'Agu', pemasukan: 45000000, pengeluaran: 29500000 },
      { bulan: 'Sep', pemasukan: 52000000, pengeluaran: 34000000 },
      { bulan: 'Okt', pemasukan: 49000000, pengeluaran: 33000000 },
      { bulan: 'Nov', pemasukan: totalPemasukanBulanIni, pengeluaran: totalPengeluaranBulanIni },
    ];

    const trendKeuangan3Bulan = [
      { bulan: 'Sep', pemasukan: 52000000, pengeluaran: 34000000 },
      { bulan: 'Okt', pemasukan: 49000000, pengeluaran: 33000000 },
      { bulan: 'Nov', pemasukan: totalPemasukanBulanIni, pengeluaran: totalPengeluaranBulanIni },
    ];

    const trendKeuangan1Tahun = [
      { bulan: 'Des 25', pemasukan: 38000000, pengeluaran: 25000000 },
      { bulan: 'Jan 26', pemasukan: 40500000, pengeluaran: 26000000 },
      { bulan: 'Feb 26', pemasukan: 41000000, pengeluaran: 27500000 },
      { bulan: 'Mar 26', pemasukan: 43500000, pengeluaran: 29000000 },
      { bulan: 'Apr 26', pemasukan: 44000000, pengeluaran: 28500000 },
      { bulan: 'Mei 26', pemasukan: 46000000, pengeluaran: 30000000 },
      { bulan: 'Jun 26', pemasukan: 42000000, pengeluaran: 28000000 },
      { bulan: 'Jul 26', pemasukan: 48500000, pengeluaran: 31000000 },
      { bulan: 'Agu 26', pemasukan: 45000000, pengeluaran: 29500000 },
      { bulan: 'Sep 26', pemasukan: 52000000, pengeluaran: 34000000 },
      { bulan: 'Okt 26', pemasukan: 49000000, pengeluaran: 33000000 },
      { bulan: 'Nov 26', pemasukan: totalPemasukanBulanIni, pengeluaran: totalPengeluaranBulanIni },
    ];

    // Weekly Breakdown of Current Month (Nov 2026)
    let w1Inc = 0, w1Exp = 0, w2Inc = 0, w2Exp = 0, w3Inc = 0, w3Exp = 0, w4Inc = 0, w4Exp = 0;
    db.financial_transactions.forEach((tx) => {
      if (tx.status === 'REVERSED') return;
      if (tx.transaction_date.startsWith(currentMonthPrefix)) {
        const day = parseInt(tx.transaction_date.split('-')[2] || '1', 10);
        if (day <= 7) {
          if (tx.type === 'INCOME') w1Inc += tx.amount; else w1Exp += tx.amount;
        } else if (day <= 14) {
          if (tx.type === 'INCOME') w2Inc += tx.amount; else w2Exp += tx.amount;
        } else if (day <= 21) {
          if (tx.type === 'INCOME') w3Inc += tx.amount; else w3Exp += tx.amount;
        } else {
          if (tx.type === 'INCOME') w4Inc += tx.amount; else w4Exp += tx.amount;
        }
      }
    });

    const trendKeuanganBulanIni = [
      { bulan: 'Minggu 1', pemasukan: w1Inc, pengeluaran: w1Exp },
      { bulan: 'Minggu 2', pemasukan: w2Inc, pengeluaran: w2Exp },
      { bulan: 'Minggu 3', pemasukan: w3Inc, pengeluaran: w3Exp },
      { bulan: 'Minggu 4', pemasukan: w4Inc, pengeluaran: w4Exp },
    ];

    // 5. Jemaat Growth Data
    const pertumbuhanJemaat = [
      { periode: 'Jan', jumlah: 8 },
      { periode: 'Mar', jumlah: 9 },
      { periode: 'Mei', jumlah: 10 },
      { periode: 'Jul', jumlah: 11 },
      { periode: 'Sep', jumlah: 11 },
      { periode: 'Nov', jumlah: totalJemaat },
    ];

    // 6. Department Members Distribution
    const distribusiDepartemen = db.departments.map((dept) => {
      const count = db.department_members.filter(
        (dm) => dm.department_id === dept.id && dm.status === 'ACTIVE'
      ).length;
      return {
        name: dept.name,
        code: dept.code,
        anggota: count,
      };
    });

    // 7. Recent Transactions (hide sensitive individual names if not Super Admin / Bendahara)
    const canSeeIndividual = role === 'SUPER_ADMIN' || role === 'BENDAHARA';
    const transaksiTerbaru = db.financial_transactions
      .slice(0, 5)
      .map((tx) => {
        if (tx.is_confidential && !canSeeIndividual) {
          return {
            ...tx,
            member_name: '*** (Dirahasiakan)',
            member_number: '***',
            description: 'Persembahan Perpuluhan (Rahasia)',
          };
        }
        return tx;
      });

    // 8. Ongoing Work Programs
    const programBerjalan = db.work_programs
      .filter((wp) => wp.status === 'ONGOING' || wp.status === 'APPROVED')
      .slice(0, 4);

    // 9. Recent Announcements
    const pengumumanTerbaru = db.announcements
      .filter((a) => a.status === 'PUBLISHED')
      .slice(0, 3);

    return NextResponse.json({
      success: true,
      stats: {
        totalJemaat,
        totalKeluarga,
        totalDepartemen,
        totalPengguna,
        totalPemasukanBulanIni,
        totalPengeluaranBulanIni,
        saldoKasBank,
        jumlahKegiatanMendatang: kegiatanMendatang.length,
      },
      charts: {
        trendKeuangan: trendKeuangan6Bulan,
        trendKeuangan3Bulan,
        trendKeuangan6Bulan,
        trendKeuangan1Tahun,
        trendKeuanganBulanIni,
        pertumbuhanJemaat,
        distribusiDepartemen,
      },
      kegiatanMendatang,
      transaksiTerbaru,
      programBerjalan,
      pengumumanTerbaru,
      budgetSummary: {
        totalBudget: db.budgets[0]?.total_budget || 0,
        totalSpent: db.budget_details.reduce((sum, d) => sum + d.realized_amount, 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
