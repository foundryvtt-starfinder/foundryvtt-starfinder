import esbuild from "esbuild";
import fs from "fs-extra";
import path from "path";
import * as Vite from "vite";

/** @type {import('vite').UserConfig} */
const config = Vite.defineConfig(async ({ command }) => {

    if (command === "build") {
        const filesToCopy = ["changelist.md", "README.md", "OGL", "LICENSE"];

        fs.promises.cp("src/packs", "dist/packs", {recursive: true});
        for (const file of filesToCopy) {
            fs.copyFile(file, `dist/${file}`);
        }

    }

    // Create dummy files for vite
    const message = "This file is for vite and is not copied to a build";
    await Promise.all([
        fs.writeFile("./index.html", `<h1>${message}</h1>\n`),
        fs.writeFile("./index.js", `/** ${message} */\n\nimport "./src/sfrpg.js";\n`)
    ]);

    return {
        root: "src/",
        base: "/systems/sfrpg/",
        publicDir: path.resolve(__dirname, "static"),
        server: {
            port: 30001,
            open: "/game",
            proxy: {
                "^(?!/systems/sfrpg)": "http://localhost:30000/",
                "/socket.io": {
                    target: "ws://localhost:30000",
                    ws: true
                }
            }
        },
        build: {
            outDir: path.resolve(__dirname, "dist"),
            emptyOutDir: false,
            sourcemap: true,
            brotliSize: true,
            minify: false,
            lib: {
                name: "sfrpg",
                entry: path.resolve(__dirname, "index.js"),
                formats: ["es"],
                fileName: "sfrpg"
            }
        },
        plugins: [
            {
                name: "minify",
                renderChunk: {
                    order: "post",
                    async handler(code, chunk) {
                        return chunk.fileName.endsWith(".js")
                            ? esbuild.transform(code, {
                                keepNames: true,
                                minifyIdentifiers: false,
                                minifySyntax: true,
                                minifyWhitespace: true,
                                sourcemap: true
                            })
                            : code;
                    }
                }
            },
            {
                name: "hmr-handler",
                apply: "serve",
                handleHotUpdate(context) {
                    if (context.file.startsWith("dist/")) return;

                    if (context.file.endsWith(".json")) {
                        const basePath = context.file.slice(context.file.indexOf("lang/"));
                        console.log(`Updating lang file at ${basePath}`);
                        fs.copyFile(context.file, `dist/${basePath}`).then(() => {
                            context.server.ws.send({
                                type: "custom",
                                event: "lang-update",
                                data: { path: `systems/sfrpg/${basePath}` }
                            });
                        });
                    } else if (context.file.endsWith(".hbs")) {
                        const basePath = context.file.slice(context.file.indexOf("templates/"));
                        console.log(`Updating template file at ${basePath}`);
                        fs.copyFile(context.file, `dist/${basePath}`).then(() => {
                            context.server.ws.send({
                                type: "custom",
                                event: "template-update",
                                data: { path: `systems/sfrpg/${basePath}` }
                            });
                        });
                    }
                }
            }
        ],
        css: {
            preprocessorOptions: {
                less: {
                    rootpath: command === "serve" ? "systems/sfrpg/" : ""
                }
            }
        }
    };
});

export default config;
