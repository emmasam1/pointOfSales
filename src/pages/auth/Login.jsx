import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { Card, Input, Form, Button, message } from "antd";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage(); // Use messageApi properly
  const navigate = useNavigate();
  const { baseUrl, saveToken } = useAuthConfig();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/login`, values);
      console.log("Login successful!", response.data);
      
      messageApi.success("Login successful!");

      sessionStorage.setItem("token", response.data.token);

      if (response.data.user.role === "super_admin") {
        navigate("/dashboard");
      } else if (response.data.role === "staff") {
        navigate("/staff-dashboard");
      }
    } catch (error) {
      console.log("Login failed:", error);

      // Show error message
      messageApi.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      {contextHolder} 
      <Card style={{ width: 300 }}>
        <Form
          name="login"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
        >
          <Form.Item
            label="Email"
            name="email"
            className="!-mb-0"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            className="!mb-3"
            rules={[
              { required: true, message: "Please input your password!" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            style={{ width: "100%", background: "#000" }}
            className="mb-2"
            loading={loading}
          >
            {loading ? "Please wait..." : "Login"}
          </Button>

          <div className="text-xs text-center">
            Don't have an account? <NavLink to="/register">Register</NavLink>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
