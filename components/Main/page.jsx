'use client';
import SideBar from "../SideBar/page";
import styles from "./styles.module.css";
import { useState, useEffect } from "react";
import { IoMdSearch } from "react-icons/io";
import { CiShoppingCart } from "react-icons/ci";
import { FaRegTrashAlt } from "react-icons/fa";
import {  
  collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDocs 
} from "firebase/firestore";
import { db } from "@/app/firebase";

function Main() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customPrices, setCustomPrices] = useState({});
  const [searchCode, setSearchCode] = useState("");
  const [filterType, setFilterType] = useState("all");
  const shop = typeof window !== "undefined" ? localStorage.getItem("shop") : "";

  useEffect(() => {
    if (!shop) return;
    const q = query(collection(db, "products"), where("shop", "==", shop));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    });
    return () => unsubscribe();
  }, [shop]);

  useEffect(() => {
    if (!shop) return;
    const q = query(collection(db, "cart"), where("shop", "==", shop));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCart(data);
    });
    return () => unsubscribe();
  }, [shop]);

  const handleAddToCart = async (product) => {
    const customPrice = Number(customPrices[product.id]);
    const finalPrice = !isNaN(customPrice) && customPrice > 0 ? customPrice : product.sellPrice;

    await addDoc(collection(db, "cart"), {
      name: product.name,
      sellPrice: finalPrice,
      quantity: 1,
      total: finalPrice,
      date: new Date(),
      shop: shop,
    });

    // اختيارية: امسح السعر من الـ input بعد الإضافة
    setCustomPrices(prev => {
      const updated = { ...prev };
      delete updated[product.id];
      return updated;
    });
  };


  const handleQtyChange = async (cartItem, delta) => {
    const newQty = cartItem.quantity + delta;
    if (newQty < 1) return;
    const newTotal = newQty * cartItem.sellPrice;
    await updateDoc(doc(db, "cart", cartItem.id), {
      quantity: newQty,
      total: newTotal,
    });
  };

  const handleDeleteCartItem = async (id) => {
    await deleteDoc(doc(db, "cart", id));
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.total, 0);

  // ⬇️ فلترة حسب نوع المنتج أو االاسم
  const filteredProducts = products.filter((p) => {
    const matchCode = searchCode.trim() === "" || p.name === searchCode.trim();
    const matchType =
      filterType === "all"
        ? true
        : filterType === "phone"
        ? p.type === "phone"
        : p.type !== "phone";
    return matchCode && matchType;
  });

  const phonesCount = products.filter(p => p.type === "phone").length;
  const otherCount = products.filter(p => p.type !== "phone").length;

  // ✅ زر حفظ الفاتورة
  const handleSaveInvoice = async () => {
    if (cart.length === 0) {
      alert("السلة فارغة، لا يمكن حفظ الفاتورة.");
      return;
    }

    const report = {
      items: cart,
      total: totalAmount,
      date: new Date(),
      shop: shop,
    };

    try {
      await addDoc(collection(db, "reports"), report);
      alert("تم حفظ الفاتورة بنجاح!");

      // 🧹 اختيارية: حذف العناصر من cart بعد الحفظ
      for (const item of cart) {
        await deleteDoc(doc(db, "cart", item.id));
      }

    } catch (error) {
      console.error("فشل حفظ الفاتورة:", error);
      alert("حدث خطأ أثناء الحفظ.");
    }
  };

  return (
    <div className={styles.mainContainer}>
      <SideBar />
      <div className={styles.middleSection}>
        <div className={styles.title}>
          <h3>المبيعات</h3>
          <div className={styles.inputBox}>
            <div className="inputContainer">
              <label><IoMdSearch /></label>
              <input type="text" list="codeList" placeholder="ابحث عن منتج" value={searchCode} onChange={(e) => setSearchCode(e.target.value)}/>
              <datalist id="codeList">
                {products.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* ✅ تصنيفات المنتج */}
        <div className={styles.categoryContainer}>
          <div
            className={styles.category}
            style={{
              backgroundColor: '#00bcd4',
              opacity: filterType === "all" ? 1 : 0.6,
              cursor: "pointer",
            }}
            onClick={() => setFilterType("all")}
          >
            <h3>كل المنتجات</h3>
            <p>{products.length} منتج</p>
          </div>
          <div
            className={styles.category}
            style={{
              backgroundColor: '#ba68c8',
              opacity: filterType === "phone" ? 1 : 0.6,
              cursor: "pointer",
            }}
            onClick={() => setFilterType("phone")}
          >
            <h3>الموبايلات</h3>
            <p>{phonesCount} منتج</p>
          </div>
          <div
            className={styles.category}
            style={{
              backgroundColor: '#ffa726',
              opacity: filterType === "other" ? 1 : 0.6,
              cursor: "pointer",
            }}
            onClick={() => setFilterType("other")}
          >
            <h3>المنتجات</h3>
            <p>{otherCount} منتج</p>
          </div>
        </div>

        <hr />

        {/* ✅ جدول عرض المنتجات */}
        <div className={styles.tableContainer}>
          <table>
                <thead>
                    <tr>
                        <th>كود المنتج</th>
                        <th>اسم المنتج</th>
                        <th>السعر</th>
                        <th>السريال</th>
                        <th>السعر النهائي</th>
                        <th>تفاعل</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map((product) => (
                        <tr key={product.id}>
                        <td>{product.code}</td>
                        <td>{product.name}</td>
                        <td>{product.sellPrice} EGP</td>
                        <td>{product.serial}</td>
                        <td>
                          <input
                          type="number"
                          placeholder="سعر مخصص"
                          value={customPrices[product.id] || ""}
                          onChange={(e) =>
                            setCustomPrices({ ...customPrices, [product.id]: e.target.value })
                          }
                        />
                        </td>
                        <td className="actions">
                            <button onClick={() => handleAddToCart(product)}>
                            <CiShoppingCart />
                            </button>
                        </td>
                        </tr>
                    ))}
                </tbody>
          </table>
        </div>
      </div>
      {/* ✅ الفاتورة */}
      <div className={styles.resetContainer}>
        <div className={styles.reset}>
          <div className={styles.resetTitle}>
            <h3>الفاتورة</h3>
            <hr />
          </div>

          <div className={styles.orderBox}>
            {cart.map((item) => (
              <div className={styles.ordersContainer} key={item.id}>
                <div className={styles.orderInfo}>
                  <div className={styles.content}>
                    <button onClick={() => handleDeleteCartItem(item.id)}><FaRegTrashAlt /></button>
                    <div className={styles.text}>
                      <h4>{item.name}</h4>
                      <p>{item.total} EGP</p>
                    </div>
                  </div>
                  <div className={styles.qtyInput}>
                    <button onClick={() => handleQtyChange(item, -1)}>-</button>
                    <input type="text" value={item.quantity} readOnly />
                    <button onClick={() => handleQtyChange(item, 1)}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.totalContainer}>
            <hr />
            <div className={styles.totalBox}>
              <h3>الاجمالي</h3>
              <strong>{totalAmount} EGP</strong>
            </div>
            <div className={styles.resetBtns}>
              <button onClick={handleSaveInvoice}>حفظ</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Main;
