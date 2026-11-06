import argparse
import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
RESOURCES = ROOT / 'website/src/main/resources'


def literal(value):
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return '1' if value else '0'
    if isinstance(value, int):
        return str(value)
    if isinstance(value, (dict, list)):
        encoded = json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode('utf-8').hex()
        return f"CONVERT(X'{encoded}' USING utf8mb4)"
    if any(character in str(value) for character in ('\\', '\n', '\r')):
        return f"CONVERT(X'{str(value).encode('utf-8').hex()}' USING utf8mb4)"
    return "'" + str(value).replace("'", "''") + "'"


def generate():
    schema = (RESOURCES / 'schema.sql').read_text(encoding='utf-8')
    tables = re.findall(r'CREATE TABLE IF NOT EXISTS `?(\w+)', schema)
    schema = schema.replace(');', ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;')
    content = json.loads((RESOURCES / 'seed-content.json').read_text(encoding='utf-8'))
    cms = json.loads((RESOURCES / 'seed-cms.json').read_text(encoding='utf-8'))
    statements = ['SET NAMES utf8mb4;', schema.rstrip(), 'START TRANSACTION;']
    guard = ' AND\n '.join(f'NOT EXISTS (SELECT 1 FROM `{table}`)' for table in tables)
    statements.append(f'SET @xgsz_initialize =\n {guard};')

    def insert(table, values):
        columns = ', '.join(f'`{column}`' for column in values)
        selected = ', '.join(literal(value) for value in values.values())
        statements.append(f'INSERT INTO `{table}` ({columns})\n SELECT {selected} WHERE @xgsz_initialize;')

    categories = {}
    for record_id, category in enumerate(cms['catalog']['categories'], start=1):
        categories[category['key']] = record_id
        insert('ProductCategories', {'id': record_id, 'name': category['name'], 'description': category['description'], 'isEnabled': category['enabled']})
        insert('site_catalog_meta', {'kind': 'categories', 'record_id': record_id, 'payload': {'key': category['key']}, 'version': 1})

    for record_id, business in enumerate(cms['catalog']['businesses'], start=1):
        insert('Businesses', {'id': record_id, **business})
        insert('site_catalog_meta', {'kind': 'businesses', 'record_id': record_id, 'payload': {}, 'version': 1})

    for kind in ('products', 'services'):
        for record_id, original in enumerate(content[kind], start=1):
            payload = {key: value for key, value in original.items() if key != 'id'}
            payload['published'] = True
            if kind == 'products':
                insert('Products', {'id': record_id, 'name': original['name'], 'description': original['desc'], 'categoryId': categories[original['category']], 'coverImage': '', 'detailImages': '[]', 'brand': '', 'isAvailable': True})
            insert('site_content', {'id': original['id'], 'kind': kind, 'product_id': record_id if kind == 'products' else None, 'payload': payload, 'version': 1})

    settings = {key: '' for key in ('phone', 'email', 'address', 'wecomName', 'wecomUrl', 'wecomQr')}
    insert('site_content', {'id': 'site-settings', 'kind': 'settings', 'payload': settings, 'version': 1})
    insert('BasicInformation', {'id': 1, 'phone': '', 'email': '', 'address': '', 'weChatImage': '', 'icp': '', 'publicSecurity': '', 'copyright': '', 'isEnable': True})
    insert('site_catalog_meta', {'kind': 'basicInformation', 'record_id': 1, 'payload': {}, 'version': 1})

    for page_id, page in cms['pages'].items():
        insert('site_page', {'id': page_id, 'payload': page, 'version': 1})
    for marker in ('cms-admin-migrated-v1', 'cms-catalog-v1', 'initial-content-v1'):
        insert('site_metadata', {'name': marker, 'content_value': 'complete'})
    statements.append('COMMIT;')
    return '\n\n'.join(statements) + '\n'


def main():
    parser = argparse.ArgumentParser(description='Generate the MySQL installer from the runtime schema and public seed content.')
    parser.add_argument('--check', action='store_true', help='Fail if init.sql does not match its source files.')
    arguments = parser.parse_args()
    destination = ROOT / 'init.sql'
    generated = generate()
    if arguments.check:
        if not destination.exists() or destination.read_text(encoding='utf-8') != generated:
            parser.exit(1, 'init.sql is stale; run python scripts/generate-database-sql.py\n')
        print('PASS: init.sql matches the runtime schema and initial content.')
    else:
        destination.write_text(generated, encoding='utf-8', newline='\n')
        print('Generated init.sql.')


if __name__ == '__main__':
    main()
