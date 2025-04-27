# Shopee API Documentation

## 1. Category Tree
**Endpoint:**  
[https://shopee.co.th/api/v4/pages/get_category_tree](https://shopee.co.th/api/v4/pages/get_category_tree)

This API retrieves the category tree structure for products on Shopee, allowing you to see the hierarchy and organization of categories.

---

## 2. Main Category
**Endpoint:**  
[https://shopee.co.th/api/v4/pages/get_homepage_category_list](https://shopee.co.th/api/v4/pages/get_homepage_category_list)

This API fetches a list of main categories shown on the homepage of Shopee. It provides a high-level view of the available categories on the platform.

---

## 3. Daily Product Discovery
**Endpoint:**  
[https://shopee.co.th/api/v4/homepage/get_daily_discover?bundle=daily_discover_main&limit=50&offset=1&category_id=11044964](https://shopee.co.th/api/v4/homepage/get_daily_discover?bundle=daily_discover_main&limit=50&offset=1&category_id=11044964)

This API retrieves daily product recommendations in the specified category. You can adjust the `limit` and `offset` parameters to customize the number of items and the starting point in the list.

- `limit`: Specifies how many products to return.
- `offset`: Defines the starting point for fetching results.
- `category_id`: Filters products by category.

---

## Notes:
- Make sure to replace the parameters like `category_id`, `limit`, and `offset` based on your needs.
- The responses from these APIs will typically be in JSON format, containing relevant product or category data.

