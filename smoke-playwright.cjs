const { chromium } = require("playwright")

const BASE = "http://localhost:3199"

const user = {
  id: 1,
  name: "Smoke Test",
  email: "test@example.com",
  type: "company",
  company_name: "Test Co",
}

async function main() {
  const browser = await chromium.launch({
    executablePath: "/Users/a123/Library/Caches/ms-playwright/chromium-1193/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
  })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  const consoleErrors = []
  const pageErrors = []
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text())
  })
  page.on("pageerror", (err) => pageErrors.push(String(err)))

  await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" })
  await page.evaluate(
    ([u]) => {
      localStorage.setItem("user", JSON.stringify(u))
      localStorage.setItem("userAuth", "true")
      localStorage.setItem("loginType", "company")
      localStorage.setItem("smartconvo_tutorial_state", JSON.stringify({ status: "skipped" }))
      document.cookie = "Token=smoke; path=/"
    },
    [user],
  )

  await page.goto(BASE + "/dashboard/workflow-studio", { waitUntil: "networkidle" })

  try {
    await page.waitForSelector(".react-flow", { timeout: 15000 })
  } catch (e) {
    await page.screenshot({ path: "/tmp/rf-debug.png" })
    const url = page.url()
    const bodyText = (await page.locator("body").innerText()).slice(0, 600)
    console.log("URL:", url)
    console.log("BODY:", bodyText)
    console.log("CONSOLE ERRORS:", consoleErrors)
    console.log("PAGE ERRORS:", pageErrors)
    throw e
  }
  console.log("PAGE LOADED: .react-flow found")

  const tabs = ["basic", "custom-nodes", "custom-edges", "interactive-connections", "selection-deletion", "fit-view", "workflow-builder"]
  const labels = ["basic flow", "custom nodes", "custom edges", "interactive connections", "selection", "fit view", "workflow builder"]
  for (let i = 0; i < tabs.length; i++) {
    await page.getByRole("tab", { name: new RegExp(labels[i], "i") }).click()
    await page.waitForTimeout(600)
    const flows = await page.locator(".react-flow").count()
    const nodes = await page.locator(".react-flow__node").count()
    console.log(`TAB ${tabs[i]}: flows=${flows} nodes=${nodes}`)
  }

  // Go back to basic, drag a node, and take screenshots
  await page.getByRole("tab", { name: /basic flow/i }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: "/tmp/rf-basic.png" })

  await page.getByRole("tab", { name: /workflow builder/i }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: "/tmp/rf-workflow.png" })

  // Filter out pre-existing layout-level fetch noise unrelated to this page
  const ignored = ["Failed to fetch", "Error fetching KPIs", "useSubscriptionInterceptor", "kpi-cards", "checkout"]
  const realErrors = consoleErrors.filter((e) => !ignored.some((k) => e.includes(k)))
  console.log("REAL CONSOLE ERRORS:", realErrors.length ? realErrors : "none")
  console.log("PAGE ERRORS:", pageErrors.length ? pageErrors : "none")

  await browser.close()
  process.exit(realErrors.length || pageErrors.length ? 1 : 0)
}

main().catch((e) => {
  console.error("SCRIPT FAILED:", e)
  process.exit(2)
})
