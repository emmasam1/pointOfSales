import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Sector,
  LineChart, Line,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";
import { message, DatePicker, Table, Select, Spin } from "antd";
import dayjs from "dayjs";
import DotLoader from "react-spinners/DotLoader";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#FF6666",
  "#A28CFF",
  "#33CCCC",
  "#FF33A1",
  "#66FF66",
  "#FF9933",
];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // New state for silent background refresh
  const [expiredCount, setExpiredCount] = useState(0);
  const [salesTrends, setSalesTrends] = useState([]);
  const [cashierBreakdown, setCashierBreakdown] = useState([]);
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

  // const getDashboardData = async (isSilent = false) => {
  //   if (!isSilent) setLoading(true);
  //   else setRefreshing(true);

  //   try {
  //     const { data } = await axios.get(`${baseUrl}/dashboard`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     setSalesTrends(data?.salesTrends || []);
  //     setCashierBreakdown(data?.cashierBreakdown || []);
  //     console.log(data);
  //     setTopProducts(
  //       (data?.topProducts || []).sort((a, b) => b.totalSold - a.totalSold)
  //     );
  //   } catch {
  //     messageApi.error("Failed to load dashboard data.");
  //   } finally {
  //     if (!isSilent) setLoading(false);
  //     else setRefreshing(false);
  //   }
  // };

  const getDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const dashboardRes = await axios.get(`${baseUrl}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(dashboardRes.data);

      const { salesTrends, cashierBreakdown, topProducts } = dashboardRes.data;

      const usersRes = await axios.get(`${baseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const users = usersRes.data?.users || [];

      // Map cashier ID to full user object
      const enrichedCashierBreakdown = cashierBreakdown.map((entry) => {
        const cashier = users.find((user) => user._id === entry.cashierId);
        return {
          ...entry,
          cashier: cashier || { fullName: "Unknown", _id: entry.cashierId },
        };
      });

      setSalesTrends(salesTrends || []);
      setCashierBreakdown(enrichedCashierBreakdown);
      setTopProducts(
        (topProducts || []).sort((a, b) => b.totalSold - a.totalSold)
      );
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      messageApi.error("Failed to load dashboard data.");
    } finally {
      if (!isSilent) setLoading(false);
      else setRefreshing(false);
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
      getDashboardData(); // Initial load (with loader)
      fetchExpiredProducts();

      const interval = setInterval(() => {
        getDashboardData(true); // Silent reload
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

  const cashierColumns = [
    {
      title: "First Name",
      key: "firstName",
      render: (_, record) => <span>{record.cashier?.firstName || "N/A"}</span>,
    },
    {
      title: "Last Name",
      key: "lastName",
      render: (_, record) => <span>{record.cashier?.lastName || "N/A"}</span>,
    },
    {
      title: "Shop",
      key: "shop",
      render: (_, record) => (
        <span>{record.cashier?.assignedShop?.name || "N/A"}</span>
      ),
    },
    {
      title: "Total Sales",
      dataIndex: "totalSales",
      key: "totalSales",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Total Discount",
      dataIndex: "totalDiscount",
      key: "totalDiscount",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Transactions",
      dataIndex: "transactions",
      key: "transactions",
    },
  ];

  return (
    <div className="p-4">
      {contextHolder}

      {/* Optional top-right mini refresh indicator */}
      {refreshing && (
        <div className="absolute top-4 right-6 z-10">
          <Spin size="small" />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="bg-white text-emerald-600 p-3 rounded-full text-xl">
              💰
            </div>
            <div className="text-right">
              <h2 className="font-semibold">Monthly Sales</h2>
              <h2 className="font-bold text-2xl">
                {formatCurrency(computedMonthlySales.totalSales)}
              </h2>
            </div>
          </div>
          <div className="flex justify-end">
            <Select
              className="w-28 text-black"
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

        <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 text-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="bg-white text-indigo-600 p-3 rounded-full text-xl">
              📅
            </div>
            <div className="text-right">
              <h2 className="font-semibold">
                Sales on {selectedDate?.format("YYYY-MM-DD")}
              </h2>
              <h2 className="font-bold text-2xl">
                {formatCurrency(dailySales)}
              </h2>
            </div>
          </div>
          <div className="flex justify-end">
            <DatePicker
              format="YYYY-MM-DD"
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-rose-400 to-rose-600 text-white rounded-xl shadow-lg p-4">
          <div className="flex items-center">
            <div className="bg-white text-rose-600 p-3 rounded-full text-xl">
              ⚠️
            </div>
            <div className="ml-4">
              <h2 className="font-semibold">Expired</h2>
              <h2 className="font-bold text-2xl">{expiredCount}</h2>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-xl shadow-lg p-4">
          <div className="flex items-center">
            <div className="bg-white text-yellow-600 p-3 rounded-full text-xl">
              🧾
            </div>
            <div className="ml-4">
              <h2 className="font-semibold">Monthly Transactions</h2>
              <h2 className="font-bold text-2xl">
                {computedMonthlySales.totalTransactions}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-bold mb-3">Sales Trend</h2>
          {loading ? (
            <div className="flex justify-center items-center h-60">
              <DotLoader />
            </div>
          ) : (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredMonthSales}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#f0f0f0",
                      borderColor: "#ccc",
                    }}
                  />
                  <Line dataKey="totalSales" fill="#6366f1" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <h2 className="text-lg font-bold mb-3">Cashier Breakdown</h2>
          {loading ? (
            <div className="flex justify-center items-center h-60">
              <DotLoader />
            </div>
          ) : (
            <Table
              size="middle"
              columns={cashierColumns}
              dataSource={cashierBreakdown}
              rowKey={(record) => record.cashier?._id || record.cashierId}
              pagination={{ pageSize: 5, position: ["bottomCenter"] }}
            />
          )}
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-bold mb-3">Cashier Sales Distribution</h2>
          {loading ? (
            <div className="flex justify-center items-center h-60">
              <DotLoader />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cashierBreakdown}
                  dataKey="totalSales"
                  nameKey="cashier.firstName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {cashierBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
