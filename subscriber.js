const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://127.0.0.1:1883')
const topic = 'iot/demo/test'

client.on('connect', function () {
  console.log('✅ 订阅端：成功连接本地Mosquitto')
  client.subscribe(topic, function (err) {
    if (!err) {
      console.log(`✅ 已订阅主题：${topic}`)
    }
  })
})

client.on('message', function (topic, message) {
  console.log(`📩 收到消息：${message.toString()}`)
})

client.on('error', (err) => {
  console.error('❌ 连接失败：', err)
})
