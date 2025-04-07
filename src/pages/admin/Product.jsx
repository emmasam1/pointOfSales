import { useEffect, useState } from "react";
import { Button, Table, Input, Modal, Form, Upload, message, Row, Col, DatePicker, Dropdown, Select } from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import dots from "../../assets/dots.png";
import { NavLink } from "react-router";
import moment from "moment";
import { useAuthConfig } from "../../context/AppState";
import axios from "axios";
import productImg from "../../assets/product-default.png";

const Product = () => {
  const { baseUrl, token, user } = useAuthConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); // New state for filtered products

  const handleCancelProductModal = () => {
    setIsOpen(false);
    form.resetFields();
    setImagePreview(null);
    setImageFile(null);
  };

  const onFinish = async (values) => {
    const productUrl = `${baseUrl}/add-product`;

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    if (imageFile) {
      formData.append("image", imageFile);
    }
    formData.append("unitPrice", values.unitPrice);
    formData.append("bulkPrice", values.bulkPrice);
    formData.append("sizes", values.sizes || []);
    formData.append("isTrending", values.isTrending || false);
    formData.append("isDiscount", values.isDiscount || false);
    formData.append("discountAmount", values.discountAmount || 0);
    formData.append("quantity", values.quantity);
    formData.append(
      "manufacturingDate",
      moment(values.manufacturingDate).format("YYYY-MM-DD")
    );
    formData.append(
      "expiryDate",
      moment(values.expiryDate).format("YYYY-MM-DD")
    );
    formData.append("category", values.category);

    try {
      setLoading(true);
      const response = await axios.post(productUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      messageApi.open({
        type: "success",
        content: "Product added successfully",
      });
      console.log(response.data)
      setProducts([...products, response.data.product]);
      setFilteredProducts([...products, response.data.product]); 
      handleCancelProductModal();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while adding the product";
      messageApi.open({
        type: "error",
        content: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategories = async () => {
    const getCat = `${baseUrl}/get-cat`;

    try {
      const response = await axios.get(getCat, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data && Array.isArray(response.data.categories)) {
        setCategories(response.data.categories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "An error occurred while fetching categories";
      messageApi.open({
        type: "error",
        content: errorMessage,
      });
    }
  };

  const fetchProducts = async () => {
    const getProductsUrl = `${baseUrl}/products`;
    try {
      const response = await axios.get(getProductsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts(response.data.products);
      setFilteredProducts(response.data.products); // Set the filtered products as well
    } catch (error) {
      console.error("Error fetching products:", error);
      messageApi.open({
        type: "error",
        content: error.response?.data?.message || "Failed to fetch products",
      });
    }
  };

  const filterNonExpired = () => {
    const now = moment();
    const nonExpired = products.filter((product) =>
      moment(product.expiryDate).isAfter(now)
    );
    setFilteredProducts(nonExpired);
  };

  const filterExpired = () => {
    const now = moment();
    const expired = products.filter((product) =>
      moment(product.expiryDate).isBefore(now)
    );
    setFilteredProducts(expired);
  };

  useEffect(() => {
    if (token) {
      getCategories();
      fetchProducts(); // Fetch products initially
    }
  }, [baseUrl, token, messageApi]);

  const dataSource = filteredProducts.map((product, index) => ({
    key: product._id || index.toString(),
    title: product.title,
    bulkPrice: product.bulkPrice,
    unitPrice: product.unitPrice,
    quantity: product.quantity,
    expiryDate: moment(product.expiryDate).format("YYYY-MM-DD"),
    manufacturingDate: moment(product.manufacturingDate).format("YYYY-MM-DD"),
    image: product.image,
    category: product.category?.name || "N/A",
  }));

  const columns = [
    {
      title: "S/N",
      dataIndex: "key",
      key: "key",
      render: (_text, _record, index) => index + 1,
    },
    {
      title: "Product Image",
      key: "image",
      render: (text, record) => (
        <img
          src={record.image ? `${record.image}` : productImg}
          alt={record.title}
          style={{ width: 50, height: 50, objectFit: "cover" }}
        />
      ),
    },
    { title: "Product Name", dataIndex: "title", key: "title" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Bulk Price", dataIndex: "bulkPrice", key: "bulkPrice" },
    { title: "Unit Price", dataIndex: "unitPrice", key: "unitPrice" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    {
      title: "Maf. Date",
      dataIndex: "manufacturingDate",
      key: "manufacturingDate",
    },
    {
      title: "Exp. Date",
      dataIndex: "expiryDate",
      key: "expiryDate",
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
                label: (
                  <NavLink to={`/product/${_record.key}`} state={{ record: _record }}>
                    View Product
                  </NavLink>
                ),
              },
              {
                key: "edit",
                label: <span>Edit</span>,
              },
              {
                key: "delete",
                label: <span>Delete</span>,
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
    <div className="p-2">
      {contextHolder}
      <div className="flex justify-between items-center my-4">
        <Button
          type="primary"
          onClick={() => setIsOpen(true)}
          className="!bg-black"
          size="midium"
        >
          Add Product <PlusOutlined />
        </Button>
        <div className="flex gap-2">
          <Button
            color="primary"
            variant="solid"
            size="midium"
            onClick={() => setFilteredProducts(products)} // Show all products
          >
            All Products
          </Button>
          <Button
            color="green"
            variant="solid"
            size="midium"
            onClick={filterNonExpired}
          >
            Non-expired
          </Button>
          <Button
            color="red"
            variant="solid"
            size="midium"
            onClick={filterExpired}
          >
            Expired
          </Button>
        </div>
      </div>
      <Table
        dataSource={dataSource}
        columns={columns}
        size="small"
        pagination={{
          pageSize: 7,
          position: ["bottomCenter"],
          className: "custom-pagination",
        }}
        className="custom-table"
      />

      <Modal
        title="Add Product"
        open={isOpen}
        onCancel={handleCancelProductModal}
        footer={null}
      >
        <Form form={form} name="product" layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Product Name"
                name="title"
                className="mb-2"
                rules={[
                  { required: true, message: "Please input product name!" },
                ]}
              >
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Description"
                name="description"
                className="mb-2"
                rules={[
                  {
                    required: true,
                    message: "Please input product description!",
                  },
                ]}
              >
                <Input.TextArea placeholder="Enter product description" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Unit Price"
                name="unitPrice"
                className="mb-2"
                rules={[
                  { required: true, message: "Please input unit price!" },
                ]}
              >
                <Input placeholder="Enter unit price" type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Bulk Price"
                name="bulkPrice"
                className="mb-2"
                rules={[
                  { required: true, message: "Please input bulk price!" },
                ]}
              >
                <Input placeholder="Enter bulk price" type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Sizes"
                name="sizes"
                className="mb-2"
                rules={[
                  {
                    required: true,
                    message: "Please select at least one size!",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select sizes"
                  options={[
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" },
                  ]}
                ></Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Is Trending"
                name="isTrending"
                valuePropName="checked"
                className="mb-2"
              >
                <Input type="checkbox" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Is Discount"
                name="isDiscount"
                valuePropName="checked"
                className="mb-2"
              >
                <Input type="checkbox" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Discount Amount"
                name="discountAmount"
                className="mb-2"
              >
                <Input placeholder="Enter discount amount" type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Quantity"
                name="quantity"
                className="mb-2"
                rules={[{ required: true, message: "Please input quantity!" }]}
              >
                <Input placeholder="Enter quantity" type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Manufacturing Date"
                name="manufacturingDate"
                className="mb-2"
                rules={[
                  {
                    required: true,
                    message: "Please select manufacturing date!",
                  },
                ]}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  placeholder="Select manufacturing date"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Expiry Date"
                name="expiryDate"
                className="mb-2"
                rules={[
                  { required: true, message: "Please select expiry date!" },
                ]}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  placeholder="Select expiry date"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Product Image" name="image" className="mb-2">
                <Upload
                  accept="image*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const isJpgOrPng =
                      file.type === "image/jpeg" || file.type === "image/png";
                    if (!isJpgOrPng) {
                      message.error("You can only upload JPG/PNG file!");
                    }
                    const isLt2M = file.size / 1024 / 1024 < 2;
                    if (!isLt2M) {
                      message.error("Image must smaller than 2MB!");
                    }
                    return isJpgOrPng && isLt2M;
                  }}
                  onChange={({ file }) => {
                    if (file.status === "done") {
                      setImageFile(file.originFileObj);
                      setImagePreview(URL.createObjectURL(file.originFileObj));
                    }
                  }}
                >
                  <Button icon={<UploadOutlined />}>Upload Image</Button>
                </Upload>
              </Form.Item>
              {imagePreview && <img src={imagePreview} alt="Product Preview" />}
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Category"
                name="category"
                className="mb-2"
                rules={[{ required: true, message: "Please select category!" }]}
              >
                <Select placeholder="Select category">
                  {categories.map((category) => (
                    <Select.Option key={category._id} value={category._id}>
                      {category.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-between">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="!bg-black"
              size="midium"
            >
              Add Product
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Product;
