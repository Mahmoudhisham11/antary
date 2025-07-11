'use client';
import SideBar from "@/components/SideBar/page";
import styles from "./styles.module.css";
import { useState, useEffect } from "react";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { GiMoneyStack } from "react-icons/gi";
import { CiSearch } from "react-icons/ci";
import { FaRegTrashAlt } from "react-icons/fa";
import { GoNumber } from "react-icons/go";
import { MdOutlinePersonOutline } from "react-icons/md";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase";

function Products() {
  const [active, setActive] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [form, setForm] = useState({
    name: "",
    buyPrice: "",
    sellPrice: "",
    quantity: "",
    owner: ""
  });

  useEffect(() => {
    const shop = localStorage.getItem("shop");
    if (!shop) return;

    const q = query(collection(db, "products"), where("shop", "==", shop), where("type", "==", "product"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(data);

      if (searchCode.trim()) {
        const filtered = data.filter((p) =>
          p.name?.toLowerCase().includes(searchCode.trim().toLowerCase())
        );
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts(data);
      }
    });

    return () => unsubscribe();
  }, [searchCode]);

  const getNextCode = async () => {
    const shop = localStorage.getItem("shop");

    const q = query(
      collection(db, "products"),
      where("shop", "==", shop)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return 1000;

    const codes = snapshot.docs
      .map(doc => Number(doc.data().code))
      .filter(code => !isNaN(code));

    const maxCode = Math.max(...codes);
    return maxCode + 1;
  };

  const handleAddProduct = async () => {
    const shop = localStorage.getItem("shop");

    if (!form.name || !form.buyPrice || !form.sellPrice || !form.quantity || !form.owner) {
      alert("❗️يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const newCode = await getNextCode();

    await addDoc(collection(db, "products"), {
      code: newCode,
      name: form.name,
      buyPrice: Number(form.buyPrice),
      sellPrice: Number(form.sellPrice),
      quantity: Number(form.quantity),
      owner: form.owner,
      date: Timestamp.now(),
      shop: shop,
      userEmail: localStorage.getItem('email'),
      type: "product"
    });

    alert("✅ تم إضافة المنتج");
    setForm({ name: "", buyPrice: "", sellPrice: "", quantity: "", owner: "" });
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.error("❌ خطأ أثناء الحذف:", err);
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
    <div className={styles.products}>
      <SideBar />
      <div className={styles.content}>
        <div className={styles.btns}>
          <button onClick={() => setActive(false)}>كل المنتجات</button>
          <button onClick={() => setActive(true)}>اضف منتج جديد</button>
        </div>

        {/* عرض المنتجات */}
        <div className={styles.phoneContainer} style={{ display: active ? "none" : "flex" }}>
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
                  <th>سعر الشراء</th>
                  <th>سعر البيع</th>
                  <th>الكمية</th>
                  <th>المورد</th>
                  <th>التاريخ</th>
                  <th>حذف</th>
                  <th>طباعة</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.code}</td>
                    <td>{product.name}</td>
                    <td>{product.buyPrice} EGP</td>
                    <td>{product.sellPrice} EGP</td>
                    <td>{product.quantity}</td>
                    <td>{product.owner}</td>
                    <td>{product.date?.toDate().toLocaleDateString("ar-EG")}</td>
                    <td>
                      <button className={styles.delBtn} onClick={() => handleDelete(product.id)}>
                        <FaRegTrashAlt />
                      </button>
                    </td>
                    <td>
                      <button className={styles.delBtn} onClick={() => handlePrintLabel(product)}>
                        🖨️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* إضافة منتج جديد */}
        <div className={styles.addContainer} style={{ display: active ? "flex" : "none" }}>
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
          </div>
          <div className={styles.inputBox}>
            <div className="inputContainer">
              <label><GoNumber /></label>
              <input
                type="number"
                placeholder="الكمية"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="inputContainer">
              <label><MdOutlinePersonOutline /></label>
              <select
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              >
                <option value="">اختر المورد</option>
                <option value="العنتري">العنتري</option>
                <option value="الحرازي">الحرازي</option>
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

export default Products;
