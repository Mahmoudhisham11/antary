'use client';
import SideBar from "@/components/SideBar/page";
import styles from "./styles.module.css";
import { useState, useEffect } from "react";
import { FaBarcode } from "react-icons/fa";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { GiMoneyStack } from "react-icons/gi";
import { CiSearch } from "react-icons/ci";
import { FaRegTrashAlt } from "react-icons/fa";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  deleteDoc,
  doc,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";

function Phones() {
  const [active, setActive] = useState(false);
  const [form, setForm] = useState({
    name: '',
    buyPrice: '',
    sellPrice: '',
    battery: '',
    storage: '',
    color: '',
    serial: '',
    tax: 'يوجد',
    box: 'يوجد',
    condition: 'جديد',
  });

  const [products, setProducts] = useState([]);
  const [searchCode, setSearchCode] = useState('');
  const shop = typeof window !== "undefined" ? localStorage.getItem("shop") : "";

  useEffect(() => {
    if (!shop) return;

    const productsRef = collection(db, "products");
    const q = query(productsRef, where("shop", "==", shop), where('type', '==', 'phone'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(data);
    });

    return () => unsubscribe();
  }, [shop]);

  const filteredProducts = searchCode
    ? products.filter(p => p.name?.toLowerCase().includes(searchCode.toLowerCase()))
    : products;

  const getNextCode = async () => {
    const q = query(collection(db, "products"), where("shop", "==", shop));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 1000;
    const codes = snapshot.docs.map(doc => Number(doc.data().code)).filter(code => !isNaN(code));
    const maxCode = Math.max(...codes);
    return maxCode + 1;
  };

  const handleAddProduct = async () => {
    try {
      if (!form.name || !form.buyPrice || !form.sellPrice || !form.battery || !form.storage || !form.color || !form.serial) {
        alert("❗️يرجى ملء جميع الحقول المطلوبة");
        return;
      }

      const newCode = await getNextCode();

      await addDoc(collection(db, "products"), {
        code: newCode,
        name: form.name,
        buyPrice: Number(form.buyPrice),
        sellPrice: Number(form.sellPrice),
        battery: form.battery,
        storage: form.storage,
        color: form.color,
        serial: form.serial,
        tax: form.tax,
        box: form.box,
        condition: form.condition,
        date: Timestamp.now(),
        type: "phone",
        shop: shop,
        userEmail: localStorage.getItem("email"),
      });

      alert("✅ تم إضافة المنتج بنجاح");

      setForm({
        name: '',
        buyPrice: '',
        sellPrice: '',
        battery: '',
        storage: '',
        color: '',
        serial: '',
        tax: 'يوجد',
        box: 'يوجد',
        condition: 'جديد',
      });

    } catch (error) {
      console.error("❌ خطأ أثناء الإضافة:", error);
      alert("حدث خطأ أثناء الإضافة");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      console.error("❌ خطأ أثناء الحذف:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const handlePrintLabel = (product) => {
    const printWindow = window.open('', '', 'width=300,height=200');
    const htmlContent = `
      <html>
        <head>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
            }
            .label {
              width: 5cm;
              height: 3cm;
              padding: 10px;
              font-size: 14px;
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              border: 1px dashed #000;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 300);">
          <div class="label">
            <div><strong>اسم المنتج:</strong> ${product.name}</div>
            <div><strong>الكود:</strong> ${product.code}</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className={styles.phones}>
      <SideBar />
      <div className={styles.content}>
        <div className={styles.btns}>
          <button onClick={() => setActive(false)}>كل الموبايلات</button>
          <button onClick={() => setActive(true)}>اضف موبايل جديد</button>
        </div>

        <div className={styles.phoneContainer} style={{ display: active ? 'none' : 'flex' }}>
          <div className={styles.searchBox}>
            <div className="inputContainer">
              <label><CiSearch /></label>
              <input
                type="text"
                list="code"
                placeholder="ابحث بالاسم"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
              <datalist id="code">
                {products.map((product) => (
                  <option key={product.id} value={product.name} />
                ))}
              </datalist>
            </div>
          </div>
          <div className={styles.tableContainer}>
            <table>
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>الاسم</th>
                  <th> الشراء</th>
                  <th>البيع</th>
                  <th>البطارية</th>
                  <th>المساحة</th>
                  <th>اللون</th>
                  <th>السريال</th>
                  <th>الضريبة</th>
                  <th>الكرتونة</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>تفاعل</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.code}</td>
                    <td>{product.name}</td>
                    <td>{product.buyPrice} EGP</td>
                    <td>{product.sellPrice} EGP</td>
                    <td>{product.battery}</td>
                    <td>{product.storage}</td>
                    <td>{product.color}</td>
                    <td>{product.serial}</td>
                    <td>{product.tax}</td>
                    <td>{product.box}</td>
                    <td>{product.condition}</td>
                    <td>{product.date?.toDate().toLocaleDateString("ar-EG")}</td>
                    <td className={styles.actionBtns}>
                      <button className={styles.delBtn} onClick={() => handleDelete(product.id)}>
                        <FaRegTrashAlt />
                      </button>
                      <button onClick={() => handlePrintLabel(product)} className={styles.print}>
                        🖨️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.addContainer} style={{ display: active ? 'flex' : 'none' }}>
          <div className={styles.inputBox}>
            <div className="inputContainer">
              <label><MdDriveFileRenameOutline /></label>
              <input
                type="text"
                placeholder="اسم المنتج"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.inputBox}>
            <div className="inputContainer">
              <label><GiMoneyStack /></label>
              <input
                type="number"
                placeholder="سعر الشراء"
                value={form.buyPrice}
                onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
              />
            </div>
            <div className="inputContainer">
              <label><GiMoneyStack /></label>
              <input
                type="number"
                placeholder="سعر البيع"
                value={form.sellPrice}
                onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
              />
            </div>
            <div className="inputContainer">
              <label>السريال</label>
              <input
                type="text"
                placeholder="السريال"
                value={form.serial}
                onChange={(e) => setForm({ ...form, serial: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.inputBox}>
            <div className="inputContainer">
              <label>البطارية</label>
              <input
                type="text"
                placeholder="البطارية"
                value={form.battery}
                onChange={(e) => setForm({ ...form, battery: e.target.value })}
              />
            </div>
            <div className="inputContainer">
              <label>المساحة</label>
              <input
                type="text"
                placeholder="المساحة"
                value={form.storage}
                onChange={(e) => setForm({ ...form, storage: e.target.value })}
              />
            </div>
            <div className="inputContainer">
              <label>اللون</label>
              <input
                type="text"
                placeholder="اللون"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.inputBox}>
            <div className="inputContainer">
              <label>الضريبة</label>
              <select
                value={form.tax}
                onChange={(e) => setForm({ ...form, tax: e.target.value })}
              >
                <option value="معفي">معفي</option>
                <option value="بضريبة">بضريبة</option>
              </select>
            </div>
            <div className="inputContainer">
              <label>الكرتونة</label>
              <select
                value={form.box}
                onChange={(e) => setForm({ ...form, box: e.target.value })}
              >
                <option value="يوجد">يوجد</option>
                <option value="لا يوجد">لا يوجد</option>
              </select>
            </div>
            <div className="inputContainer">
              <label>الحالة</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
              >
                <option value="جديد">جديد</option>
                <option value="مستعمل">مستعمل</option>
              </select>
            </div>
          </div>

          <button className={styles.addBtn} onClick={handleAddProduct}>
            اضف المنتج
          </button>
        </div>
      </div>
    </div>
  );
}

export default Phones;
