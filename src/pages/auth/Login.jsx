import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { Card, Input, Form, Button, message } from "antd";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { baseUrl, saveToken } = useAuthConfig();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/login`, values);
      // console.log("Login successful!", response.data);

      // Save the token and user data in the context (global state)
      saveToken(response.data.token, response.data.user);

      messageApi.success("Login successful!");

      if (response.data.user.role === "super_admin") {
        navigate("/dashboard");
      } else if (response.data.user.role === "cashier") {
        navigate("/staff-dashboard");
      }
    } catch (error) {
      console.log("Login failed:", error);
      messageApi.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-white">
      {contextHolder}
     
      <Card className="sm:w-auto max-w-sm !px-2">
        <h1 className="text-center text-2xl md:text-2xl font-bold mb-4">
          Enter Login Credentials
        </h1>
        <p className="text-center md:text-sm text-sm mb-6">
          Provide your Email and password to sign in
        </p>
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

          <div className="flex justify-center items-center mb-2">
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: "100%", background: "#000" }}
              className="mb-2 !w-30 !rounded-full text-[.7rem] px-7 text-sm"
              loading={loading}
            >
              {loading ? "Please wait..." : "Login"}
            </Button>
          </div>

          <div className="text-xs">
            Forget password? <NavLink to="/reset-password">Reset</NavLink>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
