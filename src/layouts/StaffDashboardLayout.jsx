import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router";
import { DesktopOutlined, PieChartOutlined } from "@ant-design/icons";
import { Layout, Menu, theme, Button, Modal, Form, Input, message } from "antd";
import { useAuthConfig } from "../context/AppState";
import Time from "../components/time/Time";
import DotLoader from "react-spinners/DotLoader";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import CryptoJS from "crypto-js";
import * as jwt_decode from "jwt-decode";
import axios from "axios";
import { useReactToPrint } from "react-to-print"; // Uncomment and implement this if needed for receipt printing

const SECRET_KEY = "mySecretKey";
const { Header, Content, Sider } = Layout;

function getItem(label, key, icon, children) {
  return { key, icon, children, label };
}

const items = [
  getItem("Dashboard", "/staff-dashboard", <PieChartOutlined />),
  getItem("Store", "/staff-dashboard/store", <DesktopOutlined />),
];

const StaffDashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [reprint, setReprint] = useState(false);

  const { user, baseUrl, token } = useAuthConfig();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [products, setProducts] = useState([]);
  const [receiptData, setReceiptData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const receiptRef = useRef();
  const receiptWidth = "90mm";

  const selectedKey = location.pathname;

  const titles = {
    "/staff-dashboard": "Dashboard",
    "/staff-dashboard/store": "Store",
  };
  const title = titles[location.pathname] || "Default Title";

  const showLogoutModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);
  const openReceipt = () => setReceiptOpen(true);

  const onFinish = async ({ receiptId }) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/receipts/search?receiptCode=${receiptId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const receipt = response.data.receipt;

      const enrichedProducts = receipt.products.map((item) => {
        const product = products.find((p) => p._id === item.product);
        return { ...item, productDetails: product || null };
      });

      const enrichedReceipt = {
        ...receipt,
        enrichedProducts,
      };

      // console.log(enrichedReceipt);
      setReceiptData(enrichedReceipt);
      setReceiptOpen(false);
      form.resetFields();
      setReprint(true); // Optionally open reprint modal here
      messageApi.success("Receipt loaded successfully.");
    } catch (error) {
      console.error("Error fetching receipt:", error);
      messageApi.error("Error searching receipt.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${baseUrl}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(response.data.products);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    fetchProducts();
  }, [token]);

    useEffect(() => {
      const handleResize = () => {
        setCollapsed(window.innerWidth < 1000);
      };
      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
    }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  const formatDate = (date) => new Date(date).toLocaleDateString("en-GB");
  const formatTime = (date) => new Date(date).toLocaleTimeString("en-US");

  const handleLogout = async () => {
    setIsModalVisible(false);

    const logoutUrl = `${baseUrl}/logout`;
    const encryptedToken = sessionStorage.getItem("token");

    if (!encryptedToken) {
      sessionStorage.clear();
      navigate("/");
      return;
    }

    const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedToken) {
      sessionStorage.clear();
      navigate("/");
      return;
    }

    try {
      const decodedToken = jwt_decode(decryptedToken);
      if (Date.now() > decodedToken.exp * 1000) {
        sessionStorage.clear();
        navigate("/");
        return;
      }
    } catch (err) {
      console.error("Invalid token:", err);
      sessionStorage.clear();
      navigate("/");
      return;
    }

    try {
      const response = await axios.post(
        logoutUrl,
        {},
        {
          headers: { Authorization: `Bearer ${decryptedToken}` },
        }
      );
      if (response.status === 200) {
        sessionStorage.clear();
        navigate("/");
      }
    } catch (err) {
      console.error("Logout failed", err);
      alert("Logout failed. Please try again.");
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    onBeforePrint: async () => {
      setLoading(true);
      try {
        await axios.post(
          `${baseUrl}/reprint`,
          { receiptId: receiptData?._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        messageApi.success("Receipt re-printed!");
        await new Promise((res) => setTimeout(res, 200));
        return true;
      } catch (error) {
        // console.log(error.response.data.message )
        messageApi.error(
          error.response.data.message || "Re-print failed. Printing canceled."
        );
        throw new Error("Print canceled.");
      } finally {
        setLoading(false);
      }
    },
    onAfterPrint: () => {
      setIsModalVisible(false);
      setCart([]);
    },
  });

  useEffect(() => {
    const encryptedToken = sessionStorage.getItem("token");

    if (!encryptedToken) {
      navigate("/");
      return;
    }

    const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedToken) {
      sessionStorage.clear();
      navigate("/");
    }

    const tokenExpiration = sessionStorage.getItem("tokenExpiration");
    if (tokenExpiration && Date.now() > tokenExpiration) {
      sessionStorage.clear();
      navigate("/");
    }
  }, [navigate]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {contextHolder}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        style={{
          backgroundColor: "#ffffff",
          // borderTopRightRadius: "1rem",
          // borderBottomRightRadius: "1rem",
          position: "fixed",
          height: "100vh",
        }}
      >
        <Menu theme="light" selectedKeys={[selectedKey]} mode="inline">
          {items.map((item) => (
            <Menu.Item key={item.key} icon={item.icon}>
              <Link to={item.key}>{item.label}</Link>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>

      <Layout>
        <Header
          style={{
            position: "fixed",
            top: 0,
            zIndex: 10,
            width: `calc(100% - ${collapsed ? 80 : 200}px)`,
            left: collapsed ? 80 : 200,
            background: theme.useToken().token.colorBgContainer,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingInline: 16,
          }}
        >
          <h3 className="text-2xl font-semibold">{title}</h3>
          <div className="flex items-center gap-4">
            <h3 className="text-md font-bold">Hi {user?.firstName}</h3>
            <Time />
            <Button
              onClick={showLogoutModal}
              type="primary"
              className="!bg-red-500"
            >
              Logout
            </Button>
            <Button
              onClick={openReceipt}
              type="primary"
              className="!bg-blue-500"
            >
              Re-print Receipt
            </Button>
          </div>
        </Header>

        <Content
          className="p-4 transition-all duration-300"
          style={{
            marginLeft: collapsed ? 80 : 200,
            paddingTop: 64,
            width: `calc(100% - ${collapsed ? 80 : 200}px)`,
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      {/* Receipt Re-print Modal */}
      <Modal
        open={reprint}
        onCancel={() => setReprint(false)}
        footer={
          <Button type="primary" onClick={handlePrint} loading={loading}>
            Re-Print Receipt
          </Button>
        }
      >
        {loading || !receiptData ? (
          <DotLoader color="#1890ff" loading={true} size={60} />
        ) : (
          <div
            ref={receiptRef} // ✅ Printable content
            className="p-4 relative"
            style={{ width: "90mm", margin: "auto" }}
          >
            <h2 className="text-xl font-bold mb-2">
              {receiptData.shop?.name || "Shop"}
            </h2>
            <p className="text-sm mb-1 font-semibold">
              {receiptData.shop?.shopAddress || "Shop Address"}
            </p>
            <p className="text-sm mb-1 font-semibold">
              Tel: {receiptData.shop?.shopPhone}
            </p>
            <p className="text-sm mb-2 font-semibold">
              Email: {receiptData.shop?.shopEmail}
            </p>

            <div className="flex justify-between">
              <p>{formatDate(receiptData.soldAt)}</p>
              <p>{formatTime(receiptData.soldAt)}</p>
            </div>

            <div className="flex justify-between">
              <p>Cashier:</p>
              <p className="uppercase font-semibold">
                {receiptData.cashier?.firstName} {receiptData.cashier?.lastName}
              </p>
            </div>
            <h2 className="watermark">{receiptData.shop?.name}</h2>
            {receiptData.printCount > 1 ? (
              <h2 className="copy_watermark">copy</h2>
            ) : null}

            <div className="flex justify-between">
              <p>Receipt No:</p>
              <p className="font-semibold">{receiptData.receiptCode}</p>
            </div>

            <div className="text-center">
              {"*".repeat(Math.floor(parseInt(receiptWidth) / 1.9))}
            </div>

            <div className="font-bold flex justify-between mb-1">
              <span className="w-3/9">Item</span>
              <span className="w-2/12 text-center">Qty</span>
              <span className="w-3/12 text-center">Unit</span>
              <span className="w-4/12 text-right">Total</span>
            </div>

            {receiptData.enrichedProducts?.map((item) => (
              <div key={item._id} className="flex justify-between">
                <span className="w-3/9">
                  {item.productDetails?.title || "N/A"}
                </span>
                <span className="w-2/12 text-center">{item.quantity}</span>
                <span className="w-3/12 text-center">
                  {item.priceAtSale - item.discount}
                </span>
                <span className="w-4/12 text-right">
                  {formatCurrency(
                    (item.priceAtSale - item.discount) * item.quantity
                  )}
                </span>
              </div>
            ))}

            <div className="text-center">
              {"*".repeat(Math.floor(parseInt(receiptWidth) / 1.9))}
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{formatCurrency(receiptData.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>{formatCurrency(receiptData.discountTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT:</span>
              <span>{formatCurrency(receiptData.vatAmount)}</span>
            </div>
            <div className="text-center">
              {"*".repeat(Math.floor(parseInt(receiptWidth) / 1.9))}
            </div>

            <p className="text-center mt-3 italic text-sm">
              Thanks for your purchase.
            </p>
            <p className="text-right font-bold text-xs">
              No refund after payment.
            </p>
          </div>
        )}
      </Modal>

      {/* Receipt Search Modal */}
      <Modal
        open={receiptOpen}
        footer={null}
        onCancel={() => setReceiptOpen(false)}
        title="Search Receipt"
        width={300}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Receipt ID"
            name="receiptId"
            rules={[
              { required: true, message: "Please enter receipt ID" },
              { pattern: /^\d+$/, message: "Must be numeric" },
            ]}
          >
            <Input placeholder="Enter receipt ID" />
          </Form.Item>

          <Form.Item className="-mb-2">
            <Button type="primary" block htmlType="submit">
              {loading ? "Searching..." : "Search Receipt"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Dialog
        open={isModalVisible}
        onClose={handleCancel}
        className="relative z-10"
      >
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:max-w-lg sm:w-full">
              <div className="bg-white p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle
                      as="h3"
                      className="text-lg font-medium text-gray-900"
                    >
                      Are you sure you want to log out?
                    </DialogTitle>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleLogout}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  Log out
                </button>
                <button
                  onClick={handleCancel}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Layout>
  );
};

export default StaffDashboardLayout;
