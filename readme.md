# Project Document

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
[https://shopee.co.th/api/v4/homepage/get_daily_discover?bundle=daily_discover_main&limit=50&offset=1](https://shopee.co.th/api/v4/homepage/get_daily_discover?bundle=daily_discover_main&limit=50&offset=1)

This API retrieves daily product recommendations in the specified category. You can adjust the `limit` and `offset` parameters to customize the number of items and the starting point in the list.

- `limit`: Specifies how many products to return.
- `offset`: Defines the starting point for fetching results.

---

## Run 3 Projects
- Run Express Server
- Run Flask Server
- Run Web Application

---

## RUN Flask Server - LLM Model:
***To create a virtual environment named venv***

```bash
python -m venv venv
```

***To activate a virtual environment (For Windows)***

```bash
venv\scripts\activate
```

***To install packages from a requirements.txt file, follow these steps:***
- Activate your virtual environment where you want to install the packages.
- Open the terminal and navigate to the project's root directory.
- Run the following command to install all the packages listed in the requirements.txt file:

```bash
pip install -r requirements.txt
```

***run flask***

```bash
python .\src\scripts\classify.py
```

---


## RUN Express Server - CORE Functions:

***Install Node packages***
```bash
npm install
```

***Run Express server***
```bash
npm run dev
```

## RUN Next - Web Application:

***Install Node packages***
```bash
npm install
```

***Run web***
```bash
npm run dev
```

## Notes:
- Make sure to replace the parameters like  `limit`, and `offset` based on your needs.
- The responses from these APIs will typically be in JSON format, containing relevant product or category data.
- You can adjust the value of the variable `classificationThreshold = 0.65`. The higher the value (up to a maximum of 1), the more accurate the filtering will be.
---