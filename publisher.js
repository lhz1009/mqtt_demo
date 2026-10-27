// publisher.js —— MQTT 发布端
// 功能：每 2 秒生成一个随机模拟温度，并发布到本地 Mosquitto 代理
const mqtt = require('mqtt')

// 连接本地 Mosquitto 代理
const client = mqtt.connect('mqtt://127.0.0.1:1883')
const topic = 'iot/demo/test'

// 连接成功后开始定时发布数据
client.on('connect', function () {
  console.log('✅ 发布端：成功连接本地Mosquitto')

  setInterval(() => {
    // 模拟温度：20.00 ~ 30.00 之间随机取值，保留两位小数
    const temperature = (20 + Math.random() * 10).toFixed(2)
    // 用 JSON 格式封装，方便网页端解析（含时间戳便于绘制曲线）
    const payload = JSON.stringify({
      temperature: Number(temperature),
      time: new Date().toLocaleTimeString()
    })

    client.publish(topic, payload)
    console.log(`📤 发布温度：${temperature} ℃`)
  }, 2000) // 每 2 秒发送一条
})

client.on('error', (err) => {
  console.error('❌ 连接失败：', err.message)
})
