import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";
import { message, DatePicker, Table } from "antd";
import dayjs from "dayjs";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { baseUrl, token } = useAuthConfig();

  const [totalSales, setTotalSales] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [salesTrends, setSalesTrends] = useState([]);
  const [dailySales, setDailySales] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [products, setProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const summary = response.data?.monthlySummary || {};
      setTotalSales(summary.totalSales || 0);
      setTotalTransactions(summary.totalTransactions || 0);

      const trends = response.data?.salesTrends || [];
      setSalesTrends(trends);

      const products = response.data?.topProducts || [];
      const sortedProducts = [...products].sort((a, b) => b.totalSold - a.totalSold);
      setTopProducts(sortedProducts);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const products = response.data.products;
      setProducts(products);

      const now = new Date();
      const expired = products.filter(
        (product) => new Date(product.expiryDate) < now
      );
      setExpiredCount(expired.length);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDailySales = (date, trends) => {
    if (!date || !Array.isArray(trends)) {
      setDailySales(0);
      return;
    }

    const selected = dayjs(date).format("YYYY-MM-DD");
    const match = trends.find(
      (item) => dayjs(item.date).format("YYYY-MM-DD") === selected
    );

    setDailySales(match?.totalSales || 0);
  };

  const handleDateChange = (date) => {
    if (!date) return;
    setSelectedDate(date);
    localStorage.setItem("selectedDate", date.format("YYYY-MM-DD"));
  };

  useEffect(() => {
    const savedDate = localStorage.getItem("selectedDate");
    if (savedDate) {
      setSelectedDate(dayjs(savedDate));
    } else {
      const today = dayjs();
      setSelectedDate(today);
      localStorage.setItem("selectedDate", today.format("YYYY-MM-DD"));
    }
  }, []);

  useEffect(() => {
    if (baseUrl && token) {
      getDashboardData();
      fetchProducts();

      const intervalId = setInterval(() => {
        getDashboardData();
        fetchProducts();
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [baseUrl, token]);

  useEffect(() => {
    if (selectedDate && salesTrends && salesTrends.length > 0) {
      calculateDailySales(selectedDate, salesTrends);
    }
  }, [selectedDate, salesTrends]);

  const topProductsColumns = [
    {
      title: "Product Name",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Quantity Sold",
      dataIndex: "totalSold",
      key: "totalSold",
    },
  ];

  return (
    <div className="p-2">
      {contextHolder}

      {/* 📊 Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* 💰 Monthly Sales */}
        <div className="flex bg-emerald-200 p-3 rounded">
          <div className="bg-emerald-500 p-3 rounded h-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="white"
              className="bi bi-currency-dollar font-bold"
              viewBox="0 0 16 16"
            >
              <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718z" />
            </svg>
          </div>
          <div className="ml-4">
            <h2 className="font-bold">Monthly Sales</h2>
            <h2 className="font-bold text-xl">{formatCurrency(totalSales)}</h2>
          </div>
        </div>

        {/* 📅 Daily Sales + Date Picker */}
        <div className="bg-indigo-200 rounded p-3 ">
          <div className="flex justify-between items-center mb-2">
            <div className="bg-indigo-500 p-3 rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="white"
                className="bi bi-clock-history"
                viewBox="0 0 16 16"
              >
                <path d="M8.515 3.5a.5.5 0 0 1 .5.5v3.379l2.121 2.122a.5.5 0 0 1-.707.707l-2.267-2.268A.5.5 0 0 1 8 7V4a.5.5 0 0 1 .515-.5z" />
                <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold">
                Sales on {selectedDate ? selectedDate.format("YYYY-MM-DD") : "N/A"}
              </h2>
              <h2 className="font-bold text-xl">{formatCurrency(dailySales)}</h2>
            </div>
          </div>
          <div className="flex justify-end">
            <DatePicker
              format="YYYY-MM-DD"
              value={selectedDate}
              onChange={handleDateChange}
              allowClear={false}
            />
          </div>
        </div>

        {/* ❌ Expired */}
        <div className="flex bg-rose-200 p-3 rounded">
          <div className="bg-rose-500 p-3 rounded h-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="white"
              className="bi bi-calendar3"
              viewBox="0 0 16 16"
            >
              <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2M1 3.857C1 3.384 1.448 3 2 3h12c.552 0 1 .384 1 .857v10.286c0 .473-.448.857-1 .857H2c-.552 0-1-.384-1-.857z" />
            </svg>
          </div>
          <div className="ml-4">
            <h2 className="font-bold">Expired</h2>
            <h2 className="font-bold text-xl">{expiredCount}</h2>
          </div>
        </div>

        {/* 🧾 Monthly Transactions */}
        <div className="flex bg-yellow-200 p-3 rounded">
          <div className="bg-yellow-500 p-3 rounded h-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="white"
              className="bi bi-receipt"
              viewBox="0 0 16 16"
            >
              <path d="M1.92.506a.5.5 0 0 1 .434.14L3 1.293l..." />
            </svg>
          </div>
          <div className="ml-4">
            <h2 className="font-bold">Monthly Transactions</h2>
            <h2 className="font-bold text-xl">{totalTransactions}</h2>
          </div>
        </div>
      </div>

      {/* 📋 Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Top Selling Products */}
        <div className="bg-white rounded shadow p-4">
          <h1 className="font-bold text-xl mb-2">Top Selling Product</h1>
          <Table
            size="small"
            dataSource={topProducts}
            columns={topProductsColumns}
            rowKey="_id"
            pagination={{
              pageSize: 7,
              position: ["bottomCenter"],
              className: "custom-pagination",
            }}
            className="custom-table"
          />
        </div>

        {/* Placeholder for Future Widget */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-bold mb-2">Cashier Sales Record</h2>
          <p>This could show charts, recent activity, or anything else you want!</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
