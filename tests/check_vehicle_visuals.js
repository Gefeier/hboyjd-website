#!/usr/bin/env node
'use strict';

// Validate the production data and configurator tables without executing UI code.
// Run from any directory: node tests/check_vehicle_visuals.js
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const failures = [];
let assertions = 0;
function check(condition, message) {
    assertions += 1;
    if (!condition) failures.push(message);
}
function read(name) { return fs.readFileSync(path.join(root, name), 'utf8'); }

try {
    const context = vm.createContext({ window: {} });
    vm.runInContext(read('vehicle-visual-data.js'), context, {
        filename: 'vehicle-visual-data.js', timeout: 1000
    });
    const assets = context.window.OYJD_VISUALS;
    if (!Array.isArray(assets) || assets.length === 0) {
        throw new Error('OYJD_VISUALS must contain appearance assets.');
    }
    const catalog = JSON.parse(read('content/vehicles.json')).models;
    const modelIds = Object.keys(catalog);
    check(modelIds.length === 45, `Expected 45 approval models, found ${modelIds.length}; review the coverage baseline.`);

    // This interval contains only data declarations and table setup. Keep the
    // real expressions, including dynamic special-vehicle choices, under test.
    const configurator = read('configurator.js');
    const start = configurator.indexOf('const typeImages =');
    const end = configurator.indexOf('const colorFilters =', start);
    if (start < 0 || end < start) throw new Error('Cannot locate the configurator data section.');
    vm.runInContext(configurator.slice(start, end), context, {
        filename: 'configurator.js:data', timeout: 1000
    });
    const tables = vm.runInContext('({ SPEC_SCHEMA, typeVariantImages, typeVariantPng })', context);
    const html = read('configurator.html');
    const types = new Set();
    for (const tag of html.matchAll(/<input\b[^>]*>/gi)) {
        if (/\bname\s*=\s*["']vehicleType["']/i.test(tag[0])) {
            const value = tag[0].match(/\bvalue\s*=\s*["']([^"']+)["']/i);
            if (value) types.add(value[1]);
        }
    }
    check(types.size > 0, 'No vehicleType controls found in configurator.html.');

    const assetIds = new Set();
    const routes = new Map();
    const modelOwners = new Map();
    const checkedFiles = new Set();
    for (const asset of assets) {
        check(typeof asset.id === 'string' && /^[a-z0-9-]+$/.test(asset.id), `Invalid appearance ID: ${asset.id}`);
        check(!assetIds.has(asset.id), `Duplicate appearance ID: ${asset.id}`);
        assetIds.add(asset.id);
        check(typeof asset.zh === 'string' && asset.zh.trim(), `${asset.id}: missing Chinese label.`);
        check(typeof asset.en === 'string' && asset.en.trim(), `${asset.id}: missing English label.`);
        check(types.has(asset.type), `${asset.id}: vehicle category ${asset.type} has no selectable control.`);

        const schema = tables.SPEC_SCHEMA[asset.type];
        check(Boolean(schema), `${asset.id}: no configurator schema for ${asset.type}.`);
        const choices = schema ? ['step1', 'step2'].flatMap(step =>
            (schema[step]?.groups || []).filter(group => group.name === 'variant').flatMap(group => group.options || [])
        ) : [];
        check(choices.includes(asset.variant), `${asset.id}: variant ${asset.variant} is not selectable in ${asset.type}.`);
        const route = asset.type + '::' + asset.variant;
        check(!routes.has(route), `${asset.id}: duplicate route ${route} also owned by ${routes.get(route)}.`);
        routes.set(route, asset.id);
        check(tables.typeVariantImages[asset.type]?.[asset.variant] === asset.image,
            `${asset.id}: display-image route does not resolve to its manifest image.`);
        check(tables.typeVariantPng[asset.type]?.[asset.variant] === asset.pixels,
            `${asset.id}: colour-pixel route does not resolve to its manifest source.`);

        for (const field of ['image', 'pixels', 'thumb']) {
            const value = asset[field];
            check(typeof value === 'string' && value.length > 0, `${asset.id}: missing ${field}.`);
            if (typeof value !== 'string' || !value) continue;
            const url = new URL(value, 'https://hboyjd.com/');
            check(url.origin === 'https://hboyjd.com', `${asset.id}: ${field} must be a local website asset.`);
            const local = path.resolve(root, '.' + decodeURIComponent(url.pathname));
            check(local.startsWith(root + path.sep), `${asset.id}: ${field} escapes the website root.`);
            if (!local.startsWith(root + path.sep) || checkedFiles.has(local)) continue;
            checkedFiles.add(local);
            let size = 0;
            try { const stat = fs.statSync(local); size = stat.isFile() ? stat.size : 0; } catch (_) { /* reported below */ }
            check(size > 0, `${asset.id}: ${field} file missing or empty: ${url.pathname}`);
        }

        check(Array.isArray(asset.models), `${asset.id}: models must be an array.`);
        for (const model of asset.models || []) {
            check(Object.hasOwn(catalog, model), `${asset.id}: unknown approval model ${model}.`);
            check(!modelOwners.has(model), `${model}: mapped more than once (${modelOwners.get(model)}, ${asset.id}).`);
            modelOwners.set(model, asset.id);
        }
        // A single image cannot change axle count between its mapped models.
        const axleCounts = new Set((asset.models || []).map(model => catalog[model]?.axle_count).filter(Boolean));
        check(axleCounts.size <= 1, `${asset.id}: mixes approval axle counts: ${Array.from(axleCounts).join(', ')}.`);
    }

    for (const model of modelIds) {
        check(modelOwners.has(model), `${model}: no explicit appearance-preview mapping.`);
    }

    // Independently verified against public approval records and reference photos.
    // These protect the precise mistakes found in the September image audit.
    const axleGuards = [
        ['EHJ9350TJZE', '2轴', 'tandem-skeleton'],
        ['JDV9350TJZE', '2轴', 'tandem-skeleton'],
        ['EHJ9400TJZ', '3轴', 'tri-axle-skeleton-v2'],
        ['EHJ9400TJZE', '3轴', 'tri-axle-skeleton-v2'],
        ['EHJ9401TJZE', '3轴', 'tri-axle-skeleton-v2'],
        ['JDV9390TJZE', '3轴', 'tri-axle-skeleton-v2'],
        ['EHJ9350XXY', '2轴', 'box-container-tandem'],
        ['EHJ9400XXYE', '3轴', 'box-container']
    ];
    for (const [model, axles, expectedAsset] of axleGuards) {
        check(catalog[model]?.axle_count === axles, `${model}: approval axle baseline changed; review ${axles}.`);
        check(modelOwners.get(model) === expectedAsset, `${model}: expected ${expectedAsset}, got ${modelOwners.get(model) || 'unmapped'}.`);
    }
    check(catalog.JDV9180XTX?.axle_count === '1轴', 'JDV9180XTX must retain its one-axle approval record.');
    check(modelOwners.get('JDV9180XTX') !== modelOwners.get('EHJ9350XXY'), 'Single-axle communication trailer must not reuse the two-axle box mapping.');
    check(modelOwners.get('JDV9180XTX') !== modelOwners.get('EHJ9400XXYE'), 'Single-axle communication trailer must not reuse the three-axle box mapping.');

    // Cross-category high/low stake routing is intentional and must stay usable.
    const stepped = assets.find(asset => asset.id === 'drop-deck-stake');
    if (stepped) {
        const choices = tables.SPEC_SCHEMA['仓栅']?.step1?.groups.find(group => group.name === 'variant')?.options || [];
        check(choices.includes('高低仓栏'), 'Stake category is missing its high/low stake choice.');
        check(tables.typeVariantImages['仓栅']?.['高低仓栏'] === stepped.image, 'High/low stake alternate route resolves to the wrong display image.');
        check(tables.typeVariantPng['仓栅']?.['高低仓栏'] === stepped.pixels, 'High/low stake alternate route resolves to the wrong colour source.');
    }

    if (failures.length) {
        console.error(`FAIL: ${failures.length} of ${assertions} checks failed.`);
        for (const failure of failures) console.error(' - ' + failure);
        process.exitCode = 1;
    } else {
        console.log(`PASS: ${assets.length} appearance assets, ${modelIds.length} approval-model mappings, ${checkedFiles.size} files and configurator variant routes (${assertions} checks).`);
        console.log('Scope: static data and routes; image anatomy, visual quality and browser interactions require separate review.');
    }
} catch (error) {
    console.error('FAIL: ' + error.message);
    process.exitCode = 1;
}
