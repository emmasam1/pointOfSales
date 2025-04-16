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
import { message, DatePicker, Table, Select } from "antd";
import dayjs from "dayjs";
import DotLoader from "react-spinners/DotLoader";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [expiredCount, setExpiredCount] = useState(0);
  const [salesTrends, setSalesTrends] = useState([]);
  const [dailySales, setDailySales] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [topProducts, setTopProducts] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  const { baseUrl, token } = useAuthConfig();

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);

  const getDashboardData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${baseUrl}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSalesTrends(data?.salesTrends || []);
      setTopProducts(
        (data?.topProducts || []).sort((a, b) => b.totalSold - a.totalSold)
      );
    } catch {
      messageApi.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiredProducts = async () => {
    try {
      const { data } = await axios.get(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const now = new Date();
      const expired = data.products?.filter(
        (p) => new Date(p.expiryDate) < now
      );
      setExpiredCount(expired.length);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    localStorage.setItem("selectedDate", date.format("YYYY-MM-DD"));
  };

  const filteredMonthSales = salesTrends.filter(
    (item) => dayjs(item.date).month() + 1 === selectedMonth
  );

  const computedMonthlySales = filteredMonthSales.reduce(
    (acc, item) => {
      acc.totalSales += item.totalSales;
      acc.totalTransactions += item.totalTransactions || 0;
      return acc;
    },
    { totalSales: 0, totalTransactions: 0 }
  );

  const calculateDailySales = () => {
    const selected = dayjs(selectedDate).format("YYYY-MM-DD");
    const found = salesTrends.find(
      (item) => dayjs(item.date).format("YYYY-MM-DD") === selected
    );
    setDailySales(found?.totalSales || 0);
  };

  useEffect(() => {
    const savedDate = localStorage.getItem("selectedDate");
    const date = savedDate ? dayjs(savedDate) : dayjs();
    setSelectedDate(date);
    localStorage.setItem("selectedDate", date.format("YYYY-MM-DD"));
  }, []);

  useEffect(() => {
    if (token && baseUrl) {
      getDashboardData();
      fetchExpiredProducts();

      const interval = setInterval(() => {
        getDashboardData();
        fetchExpiredProducts();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [baseUrl, token]);

  useEffect(() => {
    if (selectedDate && salesTrends.length > 0) {
      calculateDailySales();
    }
  }, [selectedDate, salesTrends]);

  const columns = [
    { title: "Product Name", dataIndex: "title", key: "title" },
    { title: "Quantity Sold", dataIndex: "totalSold", key: "totalSold" },
  ];

  return (
    <div className="p-4">
      {contextHolder}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Monthly Sales */}
        <div className="bg-emerald-200 rounded p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="bg-emerald-500 p-3 rounded">💰</div>
            <div>
              <h2 className="font-bold">Monthly Sales</h2>
              <h2 className="font-bold text-xl">
                {formatCurrency(computedMonthlySales.totalSales)}
              </h2>
            </div>
          </div>
          <div className="flex justify-end">
            <Select
              className="w-32"
              value={selectedMonth}
              onChange={setSelectedMonth}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <Select.Option key={i + 1} value={i + 1}>
                  {dayjs().month(i).format("MMMM")}
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>

        {/* Daily Sales */}
        <div className="bg-indigo-200 rounded p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="bg-indigo-500 p-3 rounded">📅</div>
            <div>
              <h2 className="font-bold">
                Sales on {selectedDate?.format("YYYY-MM-DD")}
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

        {/* Expired */}
        <div className="flex bg-rose-200 p-4 rounded items-center">
          <div className="bg-rose-500 p-3 rounded">⚠️</div>
          <div className="ml-4">
            <h2 className="font-bold">Expired</h2>
            <h2 className="font-bold text-xl">{expiredCount}</h2>
          </div>
        </div>

        {/* Monthly Transactions */}
        <div className="flex bg-yellow-200 p-4 rounded items-center">
          <div className="bg-yellow-500 p-3 rounded">🧾</div>
          <div className="ml-4">
            <h2 className="font-bold">Monthly Transactions</h2>
            <h2 className="font-bold text-xl">
              {computedMonthlySales.totalTransactions}
            </h2>
          </div>
        </div>
      </div>

      {/* Charts & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <h1 className="font-bold text-xl mb-3">Top Selling Products</h1>
          {loading ? (
            <div className="flex justify-center items-center h-60">
              <DotLoader />
            </div>
          ) : (
            <div className="w-full min-w-[320px]">
              <Table
                size="small"
                columns={columns}
                dataSource={topProducts}
                rowKey="_id"
                pagination={{ pageSize: 7, position: ["bottomCenter"] }}
              />
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-bold mb-3">Sales Trend</h2>
          {loading ? (
            <div className="flex justify-center items-center h-60">
              <DotLoader />
            </div>
          ) : (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredMonthSales}>
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
