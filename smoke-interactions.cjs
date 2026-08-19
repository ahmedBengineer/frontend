const { chromium } = require("playwright")

const BASE = "http://localhost:3199"
const user = { id: 1, name: "Smoke Test", email: "t@e.com", type: "company", company_name: "Test Co" }

async function main() {
  const browser = await chromium.launch({
    executablePath: "/Users/a123/Library/Caches/ms-playwright/chromium-1193/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
  })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e)))

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
  await page.waitForSelector(".react-flow", { timeout: 15000 })

  // 1) Selection & deletion: select all -> delete
  await page.getByRole("tab", { name: /selection/i }).click()
  await page.waitForTimeout(400)
  const nodeCount0 = await page.locator(".react-flow__node").count()
  await page.getByRole("button", { name: /select all/i }).click()
  await page.waitForTimeout(200)
  const selectedText = await page.getByText(/\d+ selected/).innerText()
  await page.getByRole("button", { name: /^delete$/i }).click()
  await page.waitForTimeout(300)
  const nodeCountAfter = await page.locator(".react-flow__node").count()
  console.log(`SELECT/DELETE: started=${nodeCount0} selectedText="${selectedText}" remaining=${nodeCountAfter}`)

  // 2) Fit view: auto layout + fit view buttons
  await page.getByRole("tab", { name: /fit view/i }).click()
  await page.waitForTimeout(400)
  const fitNodes = await page.locator(".react-flow__node").count()
  await page.getByRole("button", { name: /auto layout/i }).click()
  await page.waitForTimeout(400)
  const fitNodesAfter = await page.locator(".react-flow__node").count()
  await page.getByRole("button", { name: "Fit view", exact: true }).click()
  await page.waitForTimeout(400)
  console.log(`FIT VIEW: before=${fitNodes} afterAutoLayout=${fitNodesAfter}`)

  // 3) Workflow builder: HTML5 drag & drop from palette to canvas
  await page.getByRole("tab", { name: /workflow builder/i }).click()
  await page.waitForTimeout(400)
  const wfNodes0 = await page.locator(".react-flow__node").count()
  const paletteItem = page.locator("button[draggable='true']").first()
  const canvas = page.locator(".react-flow")
  const palBox = await paletteItem.boundingBox()
  const canvasBox = await canvas.boundingBox()
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer())
  await page.dispatchEvent("button[draggable='true']", "dragstart", { dataTransfer })
  await page.dispatchEvent(".react-flow__pane", "dragover", {
    dataTransfer,
    clientX: canvasBox.x + canvasBox.width / 2,
    clientY: canvasBox.y + canvasBox.height / 2,
  })
  await page.dispatchEvent(".react-flow__pane", "drop", {
    dataTransfer,
    clientX: canvasBox.x + canvasBox.width / 2,
    clientY: canvasBox.y + canvasBox.height / 2,
  })
  await page.waitForTimeout(500)
  const wfNodesAfter = await page.locator(".react-flow__node").count()
  console.log(`WORKFLOW DROP: before=${wfNodes0} after=${wfNodesAfter} (+${wfNodesAfter - wfNodes0})`)

  console.log("PAGE ERRORS:", errors.length ? errors : "none")
  await browser.close()
  process.exit(errors.length ? 1 : 0)
}

main().catch((e) => {
  console.error("SCRIPT FAILED:", e)
  process.exit(2)
})
