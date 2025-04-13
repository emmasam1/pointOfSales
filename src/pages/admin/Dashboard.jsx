import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";
import { message, DatePicker, Table } from "antd";
import dayjs from "dayjs";
import DotLoader from "react-spinners/DotLoader";

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
      const sortedProducts = [...products].sort(
        (a, b) => b.totalSold - a.totalSold
      );
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
    if (selectedDate && salesTrends.length > 0) {
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
          <div className="bg-emerald-500 p-3 rounded h-10">💰</div>
          <div className="ml-4">
            <h2 className="font-bold">Monthly Sales</h2>
            <h2 className="font-bold text-xl">{formatCurrency(totalSales)}</h2>
          </div>
        </div>

        {/* 📅 Daily Sales + Date Picker */}
        <div className="bg-indigo-200 rounded p-3 ">
          <div className="flex justify-between items-center mb-2">
            <div className="bg-indigo-500 p-3 rounded">📅</div>
            <div>
              <h2 className="font-bold">
                Sales on{" "}
                {selectedDate ? selectedDate.format("YYYY-MM-DD") : "N/A"}
              </h2>
              <h2 className="font-bold text-xl">
                {formatCurrency(dailySales)}
              </h2>
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
          <div className="bg-rose-500 p-3 rounded h-10">⚠️</div>
          <div className="ml-4">
            <h2 className="font-bold">Expired</h2>
            <h2 className="font-bold text-xl">{expiredCount}</h2>
          </div>
        </div>

        {/* 🧾 Monthly Transactions */}
        <div className="flex bg-yellow-200 p-3 rounded">
          <div className="bg-yellow-500 p-3 rounded h-10">🧾</div>
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
          <h1 className="font-bold text-xl mb-2">Top Selling Products</h1>
          {loading ? (
            <div className="flex justify-center items-center my-4 h-60 bg-white">
              <DotLoader />
            </div>
          ) : (
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
          )}
        </div>

        {/* 🧾 Sales Trend Chart */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-bold mb-2">Sales Trend</h2>
          {loading ? (
            <div className="flex justify-center items-center my-4 h-60 bg-white">
              <DotLoader />
            </div>
          ) : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={salesTrends}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalSales" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
