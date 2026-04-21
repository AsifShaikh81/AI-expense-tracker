(async () => {
  try {
    const mod = await import("bun:sqlite");
    console.log("exports:", Object.keys(mod));
    console.log("module:", mod);
  } catch (e) {
    console.error("error importing bun:sqlite", e);
    process.exitCode = 1;
  }
})();
