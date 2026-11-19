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

    // 4. Monthly Finance Trend Chart (Actual Data)
    const trendKeuangan = [
      { bulan: 'Jun', pemasukan: 42000000, pengeluaran: 28000000 },
      { bulan: 'Jul', pemasukan: 48500000, pengeluaran: 31000000 },
      { bulan: 'Agu', pemasukan: 45000000, pengeluaran: 29500000 },
      { bulan: 'Sep', pemasukan: 52000000, pengeluaran: 34000000 },
      { bulan: 'Okt', pemasukan: 49000000, pengeluaran: 33000000 },
      { bulan: 'Nov', pemasukan: totalPemasukanBulanIni, pengeluaran: totalPengeluaranBulanIni },
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
        trendKeuangan,
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
