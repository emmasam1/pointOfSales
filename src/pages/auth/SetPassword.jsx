import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, Input, Form, Button, Modal } from "antd";

const SetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();

  const onFinish = (values) => {
    setLoading(true);

    // Simulate password update
    setTimeout(() => {
      setLoading(false);
      setIsModalVisible(true);

      setTimeout(() => {
        setIsModalVisible(false);
        navigate("/");
      }, 5000);
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-white">
      <Card style={{ width: 300 }}>
        <Form name="set-password" onFinish={onFinish} layout="vertical">
          <Form.Item
            label="New Password"
            name="password"
            className="!-mb-0"
            rules={[{ required: true, message: "Please enter a new password" }]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject("Passwords do not match");
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm password" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: "100%", background: "#000" }}
            loading={loading}
          >
            {loading ? "Please wait..." : "Set Password"}
          </Button>
        </Form>
      </Card>

      <Modal open={isModalVisible} footer={null} closable={false} centered>
        <p className="text-center text-base">
          Your password has been updated successfully!
        </p>
      </Modal>
    </div>
  );
};

export default SetPassword;
