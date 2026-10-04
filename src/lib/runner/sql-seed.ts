/**
 * The sample database every SQL run starts with: a small online shop
 * (customers, products, orders, order_items), a company (departments,
 * employees with managers) and a film catalogue (movies). Made-up data,
 * built without randomness, so every lesson's output is the same each time.
 *
 * Lessons print this data: changing a row changes their expected output, so
 * the content tests will point at every lesson that needs updating.
 */
export const SQL_SEED = `
CREATE TABLE customers (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  city text,
  country text NOT NULL,
  joined_on date NOT NULL
);

INSERT INTO customers (name, email, city, country, joined_on) VALUES
  ('Mei Lin', 'mei@pandadev.test', 'London', 'UK', '2024-01-15'),
  ('Sam Ortiz', 'sam@pandadev.test', 'Madrid', 'Spain', '2024-02-03'),
  ('Ada Brooks', 'ada@pandadev.test', 'London', 'UK', '2024-02-20'),
  ('Kenji Mori', 'kenji@pandadev.test', 'Tokyo', 'Japan', '2024-03-08'),
  ('Ravi Patel', 'ravi@pandadev.test', 'Mumbai', 'India', '2024-03-30'),
  ('Lena Fischer', 'lena@pandadev.test', 'Berlin', 'Germany', '2024-04-12'),
  ('Omar Haddad', 'omar@pandadev.test', NULL, 'Egypt', '2024-05-01'),
  ('Sofia Rossi', 'sofia@pandadev.test', 'Rome', 'Italy', '2024-05-19'),
  ('Lucas Silva', 'lucas@pandadev.test', 'São Paulo', 'Brazil', '2024-06-07'),
  ('Anna Ivanova', 'anna@pandadev.test', 'Moscow', 'Russia', '2024-06-25'),
  ('Yuki Tanaka', 'yuki@pandadev.test', 'Osaka', 'Japan', '2024-07-14'),
  ('Chloe Martin', 'chloe@pandadev.test', 'Paris', 'France', '2024-08-02'),
  ('Noah Smith', 'noah@pandadev.test', 'New York', 'USA', '2024-08-21'),
  ('Zara Khan', 'zara@pandadev.test', NULL, 'UK', '2024-09-09'),
  ('Diego López', 'diego@pandadev.test', 'Mexico City', 'Mexico', '2024-09-28'),
  ('Emma Wilson', 'emma@pandadev.test', 'Sydney', 'Australia', '2024-10-16'),
  ('Ivan Petrov', 'ivan@pandadev.test', 'Moscow', 'Russia', '2024-11-04'),
  ('Grace Kim', 'grace@pandadev.test', 'Seoul', 'South Korea', '2024-11-23'),
  ('Tom Baker', 'tom@pandadev.test', 'Manchester', 'UK', '2024-12-12'),
  ('Nina Novak', 'nina@pandadev.test', 'Prague', 'Czechia', '2025-01-05');

CREATE TABLE products (
  id serial PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  price numeric(8, 2) NOT NULL CHECK (price > 0),
  stock integer NOT NULL DEFAULT 0
);

INSERT INTO products (name, category, price, stock) VALUES
  ('Jasmine Tea', 'tea', 6.50, 40),
  ('Matcha Powder', 'tea', 14.00, 12),
  ('Earl Grey', 'tea', 5.25, 0),
  ('Bamboo Crisps', 'snacks', 2.99, 120),
  ('Panda Cookies', 'snacks', 3.75, 85),
  ('Rice Crackers', 'snacks', 2.50, 60),
  ('The Bamboo Code', 'books', 12.50, 7),
  ('Algorithms in Pictures', 'books', 29.00, 3),
  ('Clean Python', 'books', 24.99, 0),
  ('Plush Panda', 'toys', 18.00, 25),
  ('Wooden Puzzle', 'toys', 11.40, 9),
  ('Kite', 'toys', 15.00, 14),
  ('Tea Pot', 'kitchen', 32.00, 6),
  ('Bamboo Chopsticks', 'kitchen', 4.20, 200),
  ('Rice Cooker', 'kitchen', 89.90, 4);

CREATE TABLE orders (
  id serial PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers (id),
  ordered_at timestamp NOT NULL,
  status text NOT NULL
    CHECK (status IN ('paid', 'shipped', 'delivered', 'cancelled'))
);

-- 40 orders from January to June 2025 by customers 1–17
-- (customers 18–20 haven't ordered anything yet).
INSERT INTO orders (customer_id, ordered_at, status)
SELECT
  (g * 7) % 17 + 1,
  timestamp '2025-01-03 09:00' + g * interval '4 days 3 hours 17 minutes',
  (ARRAY['delivered', 'delivered', 'shipped', 'paid', 'cancelled'])[g % 5 + 1]
FROM generate_series(1, 40) AS g;

CREATE TABLE order_items (
  order_id integer NOT NULL REFERENCES orders (id),
  product_id integer NOT NULL REFERENCES products (id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(8, 2) NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

-- One to three different products per order, at the product's price.
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, (o.id + k) % 3 + 1, p.price
FROM orders AS o
CROSS JOIN generate_series(1, 3) AS k
JOIN products AS p ON p.id = (o.id * 3 + k * 4) % 15 + 1
WHERE k <= o.id % 3 + 1;

CREATE TABLE departments (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  location text NOT NULL
);

INSERT INTO departments (name, location) VALUES
  ('Engineering', 'London'),
  ('Design', 'London'),
  ('Sales', 'Madrid'),
  ('Support', 'Tokyo'),
  ('Research', 'Berlin');

CREATE TABLE employees (
  id serial PRIMARY KEY,
  name text NOT NULL,
  department_id integer REFERENCES departments (id),
  manager_id integer REFERENCES employees (id),
  job_title text NOT NULL,
  salary integer NOT NULL,
  hired_on date NOT NULL
);

INSERT INTO employees (name, department_id, manager_id, job_title, salary, hired_on) VALUES
  ('Grace Hopper', NULL, NULL, 'CEO', 150000, '2015-03-01'),
  ('Alan Turing', 1, 1, 'CTO', 130000, '2016-06-15'),
  ('Ada Lovelace', 1, 2, 'Lead Engineer', 98000, '2018-01-10'),
  ('Linus Park', 1, 3, 'Engineer', 72000, '2020-09-01'),
  ('Margaret Hamilton', 1, 3, 'Engineer', 76000, '2019-04-22'),
  ('Ken Thompson', 1, 3, 'Engineer', 69000, '2022-02-14'),
  ('Barbara Liskov', 1, 2, 'Architect', 105000, '2017-11-30'),
  ('Don Norman', 2, 1, 'Head of Design', 95000, '2017-05-08'),
  ('Susan Kare', 2, 8, 'Designer', 64000, '2021-07-19'),
  ('Dieter Rams', 2, 8, 'Designer', 61000, '2023-03-06'),
  ('Mary Kay', 3, 1, 'Head of Sales', 90000, '2016-10-03'),
  ('Carlos Ruiz', 3, 11, 'Account Manager', 52000, '2021-01-11'),
  ('Elena Gomez', 3, 11, 'Account Manager', 54000, '2020-06-29'),
  ('Paul Allen', 3, 11, 'Sales Rep', 41000, '2024-04-01'),
  ('Hana Sato', 4, 1, 'Support Lead', 70000, '2018-08-20'),
  ('Taro Yamada', 4, 15, 'Support Agent', 38000, '2022-11-07'),
  ('Aiko Suzuki', 4, 15, 'Support Agent', 39500, '2023-09-18'),
  ('Marie Curie', 5, 1, 'Head of Research', 112000, '2016-02-02'),
  ('Rosalind Franklin', 5, 18, 'Researcher', 83000, '2019-12-09'),
  ('Max Planck', 5, 18, 'Researcher', 81000, '2021-05-24');

CREATE TABLE movies (
  id serial PRIMARY KEY,
  title text NOT NULL,
  year integer NOT NULL,
  director text NOT NULL,
  genre text NOT NULL,
  rating numeric(3, 1) NOT NULL,
  minutes integer NOT NULL
);

INSERT INTO movies (title, year, director, genre, rating, minutes) VALUES
  ('The Bamboo Heist', 2019, 'Mei Lin', 'comedy', 7.8, 104),
  ('Panda Express to Mars', 2023, 'Sam Ortiz', 'sci-fi', 6.9, 121),
  ('Midnight in the Forest', 2015, 'Ada Brooks', 'drama', 8.1, 112),
  ('The Last Dumpling', 2021, 'Mei Lin', 'comedy', 7.2, 95),
  ('Code Red', 2018, 'Ravi Patel', 'thriller', 6.4, 109),
  ('Snow Leopard Summer', 2020, 'Ada Brooks', 'drama', 7.6, 98),
  ('Ninja Pandas II', 2022, 'Kenji Mori', 'action', 5.9, 102),
  ('The Quiet Algorithm', 2024, 'Ravi Patel', 'sci-fi', 8.4, 131),
  ('Tea for Two Thousand', 2017, 'Sam Ortiz', 'romance', 6.7, 93),
  ('Mountain of Echoes', 2016, 'Kenji Mori', 'adventure', 7.9, 118),
  ('Bug in the Machine', 2025, 'Ada Brooks', 'thriller', 7.1, 107),
  ('The Great Bamboo Race', 2014, 'Mei Lin', 'family', 6.5, 88);
`;

/** Tables the sample database already has: lessons that create their own pick other names. */
export const SEED_TABLES = [
  "customers",
  "products",
  "orders",
  "order_items",
  "departments",
  "employees",
  "movies",
] as const;
