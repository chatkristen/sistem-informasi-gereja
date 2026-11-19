import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { InventoryItem, InventoryLoan } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const condition = searchParams.get('condition');
    const status = searchParams.get('status');

    const db = readDatabase();
    let items = [...db.inventory_items];

    if (categoryId) {
      items = items.filter((i) => i.category_id === categoryId);
    }
    if (condition) {
      items = items.filter((i) => i.condition === condition);
    }
    if (status) {
      items = items.filter((i) => i.status === status);
    }

    return NextResponse.json({
      success: true,
      items,
      categories: db.inventory_categories,
      loans: db.inventory_loans,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Add new inventory item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDatabase();

    const currentYear = new Date().getFullYear();
    const count = db.inventory_items.length + 1;
    const itemCode = `AST-${currentYear}-${String(count).padStart(4, '0')}`;

    const category = body.category_id
      ? db.inventory_categories.find((c) => c.id === body.category_id)
      : null;
    const pic = body.pic_member_id
      ? db.members.find((m) => m.id === body.pic_member_id)
      : null;

    const newItem: InventoryItem = {
      id: 'ast-' + Date.now(),
      church_id: db.church.id,
      category_id: body.category_id || undefined,
      category_name: category?.name,
      item_code: itemCode,
      name: body.name,
      quantity: Number(body.quantity) || 1,
      unit: body.unit || 'Unit',
      purchase_date: body.purchase_date || new Date().toISOString().split('T')[0],
      purchase_price: Number(body.purchase_price) || 0,
      condition: body.condition || 'BAIK',
      location: body.location || 'Gedung Utama',
      pic_member_id: body.pic_member_id || undefined,
      pic_member_name: pic?.full_name || body.pic_member_name,
      status: 'AVAILABLE',
      created_at: new Date().toISOString(),
    };

    db.inventory_items.push(newItem);
    writeDatabase(db);

    logAudit(db.church.id, body.actor_name || 'Admin', 'CREATE', 'INVENTARIS', newItem.item_code, {
      nama_barang: newItem.name,
      lokasi: newItem.location,
    });

    return NextResponse.json({ success: true, data: newItem });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
