'use client';
import SideBar from "@/components/SideBar/page";
import styles from "./styles.module.css";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/app/firebase";

function Reports() {
    const [selectedDate, setSelectedDate] = useState("");
    const [reports, setReports] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const shop = typeof window !== "undefined" ? localStorage.getItem("shop") : "";

    useEffect(() => {
        if (!shop) return;

        const q = query(collection(db, "reports"), where("shop", "==", shop));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (selectedDate) {
                const filteredReports = allReports.filter((report) => {
                    if (!report.date) return false;
                    const reportDate = new Date(report.date.seconds * 1000).toDateString();
                    const selected = new Date(selectedDate).toDateString();
                    return reportDate === selected;
                });
                setReports(filteredReports);

                let total = 0;
                filteredReports.forEach((report) => {
                    report.cart?.forEach((item) => {
                        total += item.sellPrice * item.quantity;
                    });
                });
                setTotalAmount(total);
            } else {
                setReports(allReports);

                let total = 0;
                allReports.forEach((report) => {
                    report.cart?.forEach((item) => {
                        total += item.sellPrice * item.quantity;
                    });
                });
                setTotalAmount(total);
            }
        });

        return () => unsubscribe();
    }, [selectedDate, shop]);

    return (
        <div className={styles.reports}>
            <SideBar />
            <div className={styles.content}>
                <div className="inputContainer">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
                <div className={styles.tableContainer}>
                    <table>
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th>السعر</th>
                                <th>السريال</th>
                                <th>الكمية</th>
                                <th>اسم العميل</th>
                                <th>رقم الهاتف</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) =>
                                report.cart?.map((item, index) => (
                                    <tr key={`${report.id}-${index}`}>
                                        <td>{item.name}</td>
                                        <td>{item.sellPrice} EGP</td>
                                        <td>{item.serial || "-"}</td>
                                        <td>{item.quantity}</td>
                                        <td>{report.name}</td>
                                        <td>{report.phone}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={6} style={{ textAlign: "right", fontWeight: "bold" }}>
                                    الاجمالي: {totalAmount} EGP
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Reports;
