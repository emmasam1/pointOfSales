import { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, message, Dropdown } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAuthConfig } from "../../context/AppState";
import axios from "axios";
import dots from "../../assets/dots.png";
import { NavLink } from "react-router";

const Staff = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [staffData, setStaffData] = useState([]); // To hold staff data
  const { baseUrl, token } = useAuthConfig();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage(); // Hook for message API

  // Show modal
  const showModal = () => {
    setIsModalVisible(true);
  };

  // Close modal and reset form fields
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    const staffUrl = `${baseUrl}/invite-cashier`;

    const newStaff = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
    };

    try {
      setLoading(true); // Show loading indicator

      const response = await axios.post(staffUrl, newStaff, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Log the API response
      console.log("API Response:", response.data);

      // Assuming response.data contains the new staff member data
      setStaffData((prevData) => [...prevData, response.data]);

      // Show success message
      messageApi.success("Staff Added Successfully");

      // Close the modal
      setIsModalVisible(false);
      form.resetFields(); // Clear the form
    } catch (error) {
      // Log the error for debugging
      console.error("Error adding staff:", error);

      // Ensure the error message is from the response data, otherwise default to a generic message
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while adding the staff.";

      // Show error message
      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const staffUrl = `${baseUrl}/users`;
    try {
      const response = await axios.get(staffUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStaffData(response.data.users);
    } catch (error) {
      console.error("Error fetching staff data:", error);
      messageApi.error("Failed to fetch staff data");
    }
  };

  const assignStaff = async (record) => {
    const staffUrl = `${baseUrl}/assign-cashier`;

    try {
      const response = await axios.put(staffUrl, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data);
      messageApi.success("Staff Assigned Successfully");
    } catch (error) {
      console.error("Error assigning staff:", error);
      messageApi.error("Failed to assign staff");
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [baseUrl, token]);

  // Table columns
  const columns = [
    {
      title: "S/N",
      dataIndex: "key",
      key: "key",
      render: (_text, _record, index) => index + 1,
    },
    {
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Phone",
      dataIndex: "phone", // Assuming 'phone' exists in your data
      key: "phone",
    },
    {
      title: "Guarantor Name",
      dataIndex: "guarantorName", // Assuming 'guarantorName' exists in your data
      key: "guarantorName",
    },
    {
      title: "Guarantor Phone",
      dataIndex: "guarantorPhone", // Assuming 'guarantorPhone' exists in your data
      key: "guarantorPhone",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Actions",
      key: "operations",
      render: (_record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: <span>View User</span>,
              },
              {
                key: "edit",
                label: (
                  <span onClick={() => assignStaff(_record)}>Assign User</span>
                ), // Corrected function call
              },
              {
                key: "delete",
                label: <span>Block User</span>,
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button>
            <img src={dots} alt="Actions" className="flex items-center justify-center w-1" />
          </Button>
        </Dropdown>
      ),
      width: 100,
    },
  ];

  return (
    <div className="p-4">
      {contextHolder} {/* This needs to be rendered in the component JSX */}

      <div className="flex justify-between items-center my-4">
        <Button
          type="primary"
          onClick={showModal}
          className="!bg-black"
          size="medium"
        >
          Add Staff <PlusOutlined />
        </Button>
      </div>

      {/* Table to display staff data */}
      <Table
        dataSource={staffData}
        columns={columns}
        rowKey={(record) => record._id} // Ensure your rowKey is correct, it should be a unique identifier like _id
        size="small"
        pagination={{
          pageSize: 7,
          position: ["bottomCenter"],
          className: "custom-pagination",
        }}
        className="custom-table"
      />

      {/* Modal for adding staff */}
      <Modal
        title="Add Staff"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          initialValues={{
            firstName: "",
            lastName: "",
            email: "",
            password: "",
          }}
        >
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: "Please input the first name!" }]}
          >
            <Input placeholder="Enter first name" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: "Please input the last name!" }]}
          >
            <Input placeholder="Enter last name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please input the email!" },
              { type: "email", message: "Please input a valid email!" },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input the password!" }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <div className="flex justify-end">
            <Button onClick={handleCancel} className="mr-2">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Staff;
