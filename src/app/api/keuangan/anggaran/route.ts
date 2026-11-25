import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { Budget, BudgetDetail } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get('year')) || 2026;

    const db = readDatabase();
    const budget = db.budgets.find((b) => b.year === year) || db.budgets[0];

    if (!budget) {
      return NextResponse.json({ success: true, data: null, details: [] });
    }

    const details = db.budget_details.filter((d) => d.budget_id === budget.id);

    return NextResponse.json({
      success: true,
      budget,
      details,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDatabase();

    const newDetail: BudgetDetail = {
      id: 'bd-' + Date.now(),
      budget_id: body.budget_id || 'b2026',
      department_id: body.department_id || undefined,
      department_name: body.department_name,
      category_id: body.category_id || undefined,
      category_name: body.category_name,
      allocated_amount: Number(body.allocated_amount) || 0,
      realized_amount: 0,
    };

    db.budget_details.push(newDetail);

    // Update total budget
    const budget = db.budgets.find((b) => b.id === newDetail.budget_id);
    if (budget) {
      budget.total_budget = db.budget_details
        .filter((d) => d.budget_id === budget.id)
        .reduce((sum, d) => sum + d.allocated_amount, 0);
    }

    writeDatabase(db);
    logAudit(db.church.id, body.actor_name || 'Bendahara', 'CREATE', 'ANGGARAN', newDetail.id, {
      alokasi: newDetail.allocated_amount,
      departemen: newDetail.department_name,
    });

    return NextResponse.json({ success: true, data: newDetail });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const db = readDatabase();
    const index = db.budget_details.findIndex((d) => d.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Pos anggaran tidak ditemukan' }, { status: 404 });
    }

    const removed = db.budget_details.splice(index, 1)[0];

    // Update total budget
    const budget = db.budgets.find((b) => b.id === removed.budget_id);
    if (budget) {
      budget.total_budget = db.budget_details
        .filter((d) => d.budget_id === budget.id)
        .reduce((sum, d) => sum + d.allocated_amount, 0);
    }

    writeDatabase(db);
    logAudit(db.church.id, 'Bendahara', 'DELETE', 'ANGGARAN', removed.id, {
      departemen: removed.department_name,
      alokasi: removed.allocated_amount,
    });

    return NextResponse.json({ success: true, message: 'Pos anggaran berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
