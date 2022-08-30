import fs from 'fs-extra';
import glob from 'glob';
import path from 'path';
import { getEnabledPlugins, sanitizePath } from './shared.js';

/**
 * 
 * @param {*} pluginName
 * @return {{ client: Array<string>, server: Array<string>, shared: Array<string> }} 
 */
function copyPluginFiles(pluginName) {
    const pluginFolder = sanitizePath(path.join(process.cwd(), 'src/core/plugins', pluginName));

    const files = glob.sync(sanitizePath(path.join(pluginFolder, '@(client|server)/index.ts')));

    const hasClientFiles = !!files.find(file => file.includes('client/index.ts'));
    const hasServerFiles = !!files.find(file => file.includes('server/index.ts'));
    const hasSharedFiles = fs.existsSync(sanitizePath(path.join(pluginFolder, 'shared')));

    return {
        client: hasClientFiles,
        server: hasServerFiles,
        shared: hasSharedFiles,
    }
}

function writeServerImports(plugins) {
    if (!plugins.length) return;

    const importsHeader = `// THIS FILE IS AUTOMATICALLY GENERATED. DO NOT MODIFY CONTENTS\n\n`;

    let content = importsHeader + "import { PluginSystem } from '../../../server/systems/plugins';\n\n";

    content = content + plugins.map(pluginName => {
        return `import '../../${pluginName}/server';`;
    }).join('\n');

    content = content + `\n\nPluginSystem.init();\n`

    const importPath = sanitizePath(path.join(process.cwd(), 'resources/core/plugins/athena/server/imports.js'));
    fs.outputFileSync(importPath, content);
}

function writeClientImports(plugins) {
    if (!plugins.length) return;

    const importsHeader = `// THIS FILE IS AUTOMATICALLY GENERATED. DO NOT MODIFY CONTENTS\n\n`;

    const content = importsHeader + plugins.map(pluginName => {
        return `import '../../${pluginName}/client';`;
    }).join('\n');

    const importPath = sanitizePath(path.join(process.cwd(), 'resources/core/plugins/athena/client/imports.js'));
    fs.outputFileSync(importPath, content + '\n');
}

function run() {
    const enabledPlugins = getEnabledPlugins();

    const clientImports = [];
    const serverImports = [];

    for (const pluginName of enabledPlugins) {
        const result = copyPluginFiles(pluginName);

        if (result.client) {
            clientImports.push(pluginName);
        }

        if (result.server) {
            serverImports.push(pluginName);
        }
    }

    writeServerImports(serverImports);
    writeClientImports(clientImports);

    console.log(`Enabled plugins: ${enabledPlugins.length} (${clientImports.length} client, ${serverImports.length} server)`);
}

run();
