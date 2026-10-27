// web-server.js —— 中转服务（HTTP 静态页面 + MQTT → WebSocket）
// 功能：1. 提供 http://127.0.0.1:8080/ 访问可视化页面
//       2. 订阅 MQTT 主题，把温度数据通过 WebSocket 实时推送给网页
const http = require('http')
const fs = require('fs')
const path = require('path')
const mqtt = require('mqtt')
const { WebSocketServer } = require('ws')

const MQTT_TOPIC = 'iot/demo/test'
const PORT = 8080 // 网页访问端口（Mosquitto 的 8080 websockets 监听已停用，让位给本服务）

// 1. 创建 HTTP 服务：浏览器访问时返回 index.html
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500)
        res.end('index.html 读取失败')
        return
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(data)
    })
  } else if (req.url === '/chart.umd.min.js') {
    // 本地提供 Chart.js，避免浏览器访问 CDN 失败
    fs.readFile(path.join(__dirname, 'chart.umd.min.js'), (err, data) => {
      if (err) {
        res.writeHead(500)
        res.end('chart.umd.min.js 读取失败')
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/javascript' })
      res.end(data)
    })
  } else {
    res.writeHead(404)
    res.end('Not Found')
  }
})

// 2. 在同一个 HTTP 服务上挂载 WebSocket 服务
const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  console.log('🌐 网页客户端已接入')
  ws.on('close', () => console.log('🌐 网页客户端已断开'))
})

// 3. 连接本地 Mosquitto 并订阅主题
const mqttClient = mqtt.connect('mqtt://127.0.0.1:1883')

mqttClient.on('connect', () => {
  console.log('✅ 中转服务：已连接本地Mosquitto')
  mqttClient.subscribe(MQTT_TOPIC, (err) => {
    if (!err) console.log(`✅ 已订阅主题：${MQTT_TOPIC}`)
  })
})

mqttClient.on('error', (err) => {
  console.error('❌ MQTT 连接失败：', err.message)
})

// 4. 收到 MQTT 消息后，广播给所有在线的网页客户端
mqttClient.on('message', (topic, message) => {
  const data = message.toString()
  console.log(`📩 MQTT收到：${data}`)
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data)
    }
  })
})

// 5. 启动服务
server.listen(PORT, () => {
  console.log(`✅ 服务已启动，浏览器访问：http://127.0.0.1:${PORT}/`)
})
