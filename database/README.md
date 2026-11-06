# MySQL 数据库交付

使用 MySQL 8.0+。`create-database.sql` 创建示例数据库 `xgsz_website`；根目录 `init.sql` 包含全部 20 张表和公开初始内容，和当前官网后端配套。

## 首次导入

在仓库根目录进入 MySQL 客户端，输入自己的数据库管理账号密码：

```sh
mysql --default-character-set=utf8mb4 -u root -p
```

依次执行（适用于 Windows、Linux 和 macOS 的 MySQL 客户端）：

```sql
SOURCE database/create-database.sql;
USE xgsz_website;
SOURCE init.sql;
```

可将数据库名改为公司的实际数据库名。`init.sql` 不绑定库名，执行前必须先 `USE` 目标数据库。为应用单独创建数据库账号并授予该库的读写权限，例如在同一台机器部署时：

```sql
CREATE USER 'xgsz_website'@'localhost' IDENTIFIED BY '替换为公司实际设置的强密码';
GRANT SELECT, INSERT, UPDATE, DELETE ON xgsz_website.* TO 'xgsz_website'@'localhost';
```

执行前替换示例密码；已有账号则使用其现有配置。数据库独立部署时，账号允许连接的主机应改为应用服务器的实际来源。应用连接参数见 [部署说明](../docs/部署说明.md)，应用不需要数据库 root 权限。

SQL 包含 3 个产品分类、3 项产品、4 项服务、3 项合作方向、8 组页面内容及留空的企业联系方式。未写入任何管理员密码、客户、订单、咨询、测试账号或服务器运行数据。首次访问 `/admin.html` 时自行创建管理员。

已有数据时会跳过整套初始内容，不覆盖已修改内容，不重新生成已删除内容。建表使用 `IF NOT EXISTS`，初始内容在事务中写入。该文件用于新部署，不是旧框架数据库的结构升级脚本；对已有旧库操作前应单独评估结构并备份。

## 数据分布

| 表 | 用途 |
| --- | --- |
| `Products`、`ProductCategories` | 产品基础资料与分类 |
| `site_content` | 产品展示扩展、服务、联系方式及内容版本 |
| `site_page` | 8 组页面文案和列表 |
| `Brands`、`BrandAuthorizationCertificates` | 合作品牌与授权证书 |
| `Carousels`、`ProductsCarousels` | 轮播与推荐产品 |
| `About`、`Businesses`、`BasicInformation` | 公司展示、合作方向与基础信息 |
| `site_catalog_meta` | 业务表的官网扩展字段与版本 |
| `Admins`、`site_admin` | 管理员及历史管理员迁移兼容 |
| `site_inquiry`、`site_media` | 业务咨询与上传图片 |
| `site_metadata` | 首次初始化和迁移标记 |
| `User`、`Orders`、`user_location` | 原框架兼容表；官网不开放相应功能和接口 |

## 维护 SQL

表结构来源为 `website/src/main/resources/schema.sql`，初始内容来源为同目录 `seed-content.json`、`seed-cms.json`。更新来源后重新生成根目录 SQL，避免两套定义不一致：

```sh
python scripts/generate-database-sql.py
python scripts/generate-database-sql.py --check
python -m unittest discover -s scripts/tests -v
```

Python 3.10+ 只用于维护交付 SQL，运行官网不需要 Python。JSON 使用 UTF-8 十六进制字面量，保证中文、换行和引号不受数据库会话的转义模式影响；原始文案可在上述 JSON 文件中阅读。
