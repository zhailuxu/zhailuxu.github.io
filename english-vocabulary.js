/*
 * 小学 1–6 年级通用核心词汇（项目独立整理，2026-09-04）。
 * 不是特定出版社教材词表；emoji 为 Unicode 文本，由用户设备渲染。
 */
(function () {
  'use strict';

  const parse = (grade, text) => text.trim().split('\n').map(line => {
    const [word, cn, emoji] = line.split('|');
    return { word, cn, emoji, grade };
  });

  window.GRADE_WORDS = {
    grade1: parse(1, `
apple|苹果|🍎
banana|香蕉|🍌
orange|橙子|🍊
pear|梨|🍐
grape|葡萄|🍇
cat|猫|🐱
dog|狗|🐶
bird|鸟|🐦
fish|鱼|🐟
duck|鸭子|🦆
rabbit|兔子|🐰
panda|熊猫|🐼
red|红色|🔴
blue|蓝色|🔵
green|绿色|🟢
yellow|黄色|🟡
black|黑色|⚫
white|白色|⚪
one|一|1️⃣
two|二|2️⃣
three|三|3️⃣
four|四|4️⃣
five|五|5️⃣
six|六|6️⃣
seven|七|7️⃣
eight|八|8️⃣
nine|九|9️⃣
ten|十|🔟
father|爸爸|👨
mother|妈妈|👩
brother|兄弟|👦
sister|姐妹|👧
family|家庭|👨‍👩‍👧‍👦
teacher|老师|🧑‍🏫
student|学生|🧑‍🎓
book|书|📖
pen|钢笔|🖊️
pencil|铅笔|✏️
ruler|尺子|📏
eraser|橡皮|◻️
bag|书包|🎒
desk|书桌|🪑
eye|眼睛|👁️
ear|耳朵|👂
nose|鼻子|👃
mouth|嘴巴|👄
hand|手|✋
head|头|🙂
run|跑|🏃
jump|跳|🦘
sing|唱歌|🎤
dance|跳舞|💃
read|阅读|📚
draw|画画|🎨
happy|开心的|😊
sad|难过的|😢
big|大的|🐘
small|小的|🐭
sun|太阳|☀️
moon|月亮|🌙`),

    grade2: parse(2, `
peach|桃子|🍑
watermelon|西瓜|🍉
strawberry|草莓|🍓
mango|芒果|🥭
lemon|柠檬|🍋
lion|狮子|🦁
tiger|老虎|🐯
monkey|猴子|🐒
elephant|大象|🐘
bear|熊|🐻
horse|马|🐴
cow|奶牛|🐄
pig|猪|🐷
sheep|绵羊|🐑
chicken|鸡|🐔
pink|粉色|🩷
purple|紫色|🟣
brown|棕色|🟤
eleven|十一|1️⃣1️⃣
twelve|十二|1️⃣2️⃣
thirteen|十三|1️⃣3️⃣
fourteen|十四|1️⃣4️⃣
fifteen|十五|1️⃣5️⃣
sixteen|十六|1️⃣6️⃣
seventeen|十七|1️⃣7️⃣
eighteen|十八|1️⃣8️⃣
nineteen|十九|1️⃣9️⃣
twenty|二十|2️⃣0️⃣
grandfather|爷爷；外公|👴
grandmother|奶奶；外婆|👵
uncle|叔叔；舅舅|👨
aunt|阿姨；姑姑|👩
cousin|堂（表）兄弟姐妹|🧒
friend|朋友|🫶
classroom|教室|🏫
school|学校|🏫
chair|椅子|🪑
crayon|蜡笔|🖍️
paper|纸|📄
door|门|🚪
window|窗户|🪟
face|脸|🙂
hair|头发|💇
arm|胳膊|💪
leg|腿|🦵
foot|脚|🦶
eat|吃|🍽️
drink|喝|🥤
sleep|睡觉|😴
walk|走路|🚶
swim|游泳|🏊
play|玩|🛝
good|好的|👍
bad|坏的|👎
tall|高的|📏
short|矮的；短的|↕️
hot|热的|🥵
cold|冷的|🥶
star|星星|⭐
cloud|云|☁️`),

    grade3: parse(3, `
bread|面包|🍞
rice|米饭|🍚
noodles|面条|🍜
egg|鸡蛋|🥚
milk|牛奶|🥛
water|水|💧
juice|果汁|🧃
cake|蛋糕|🍰
ice cream|冰淇淋|🍦
hamburger|汉堡包|🍔
vegetable|蔬菜|🥬
tomato|西红柿|🍅
potato|土豆|🥔
carrot|胡萝卜|🥕
breakfast|早餐|🍳
lunch|午餐|🥪
dinner|晚餐|🍲
bedroom|卧室|🛏️
bathroom|浴室|🚿
kitchen|厨房|🍳
living room|客厅|🛋️
home|家|🏠
bed|床|🛏️
table|桌子|🪑
sofa|沙发|🛋️
lamp|灯|💡
clock|时钟|🕐
computer|电脑|💻
phone|电话|📱
picture|图片|🖼️
shirt|衬衫|👕
T-shirt|T恤衫|👕
dress|连衣裙|👗
skirt|短裙|👗
coat|外套|🧥
jacket|夹克|🧥
trousers|裤子|👖
shoes|鞋|👟
hat|帽子|🧢
sock|短袜|🧦
bus|公共汽车|🚌
car|小汽车|🚗
bike|自行车|🚲
train|火车|🚆
plane|飞机|✈️
ship|轮船|🚢
morning|早晨|🌅
afternoon|下午|🌤️
evening|傍晚|🌆
night|夜晚|🌙
today|今天|📅
tomorrow|明天|➡️
yesterday|昨天|⬅️
Monday|星期一|1️⃣
Tuesday|星期二|2️⃣
Wednesday|星期三|3️⃣
Thursday|星期四|4️⃣
Friday|星期五|5️⃣
Saturday|星期六|6️⃣
Sunday|星期日|7️⃣`),

    grade4: parse(4, `
spring|春天|🌱
summer|夏天|☀️
autumn|秋天|🍂
winter|冬天|❄️
warm|温暖的|🌤️
cool|凉爽的|🍃
sunny|晴朗的|☀️
rainy|下雨的|🌧️
windy|有风的|🌬️
snowy|下雪的|🌨️
weather|天气|🌦️
January|一月|1️⃣
February|二月|2️⃣
March|三月|3️⃣
April|四月|4️⃣
May|五月|5️⃣
June|六月|6️⃣
July|七月|7️⃣
August|八月|8️⃣
September|九月|9️⃣
October|十月|🔟
November|十一月|🍂
December|十二月|🎄
library|图书馆|📚
playground|操场|🏟️
office|办公室|🏢
hospital|医院|🏥
cinema|电影院|🎦
park|公园|🏞️
supermarket|超市|🛒
restaurant|餐馆|🍽️
farm|农场|🚜
zoo|动物园|🦒
doctor|医生|🧑‍⚕️
nurse|护士|🧑‍⚕️
driver|司机|🧑‍✈️
farmer|农民|🧑‍🌾
cook|厨师；烹饪|🧑‍🍳
worker|工人|🧑‍🏭
police officer|警察|👮
music|音乐|🎵
art|美术|🎨
math|数学|➗
English|英语|🔤
Chinese|语文；中文|🀄
science|科学|🔬
subject|学科|📚
lesson|课|📝
homework|家庭作业|✍️
listen|听|👂
speak|说|🗣️
write|写|✍️
watch|观看|👀
help|帮助|🤝
clean|打扫；干净的|🧹
open|打开|📂
close|关闭|📕
start|开始|▶️
finish|完成|🏁
learn|学习|🧠`),

    grade5: parse(5, `
usually|通常|🔁
often|经常|🔄
sometimes|有时|🕰️
always|总是|♾️
never|从不|🚫
early|早的|🌅
late|晚的；迟的|🌙
busy|忙碌的|🐝
free|空闲的|🆓
clever|聪明的|💡
kind|友善的|💗
polite|有礼貌的|🙇
shy|害羞的|☺️
strict|严厉的|📏
helpful|乐于助人的|🤝
young|年轻的|🧒
old|年老的；旧的|👴
strong|强壮的|💪
quiet|安静的|🤫
funny|有趣的|😄
mountain|山|⛰️
river|河流|🏞️
lake|湖|🌊
forest|森林|🌲
tree|树|🌳
flower|花|🌸
grass|草|🌿
village|村庄|🏘️
city|城市|🏙️
bridge|桥|🌉
building|建筑物|🏢
road|道路|🛣️
weekend|周末|🗓️
holiday|假期|🏖️
picnic|野餐|🧺
travel|旅行|🧳
visit|拜访；参观|🚪
take photos|拍照|📷
go shopping|购物|🛍️
play football|踢足球|⚽
play basketball|打篮球|🏀
play ping-pong|打乒乓球|🏓
do kung fu|练功夫|🥋
ride a bike|骑自行车|🚲
go fishing|去钓鱼|🎣
go hiking|去远足|🥾
plant trees|植树|🌳
wash clothes|洗衣服|🧺
do housework|做家务|🧹
make the bed|整理床铺|🛏️
first|第一|🥇
second|第二|🥈
third|第三|🥉
fourth|第四|4️⃣
fifth|第五|5️⃣
twelfth|第十二|1️⃣2️⃣
twentieth|第二十|2️⃣0️⃣
kilometre|千米|🛣️
metre|米|📏
minute|分钟|⏱️`),

    grade6: parse(6, `
country|国家|🌍
world|世界|🌎
China|中国|🇨🇳
Canada|加拿大|🇨🇦
America|美国|🇺🇸
Australia|澳大利亚|🇦🇺
Britain|英国|🇬🇧
museum|博物馆|🏛️
bookstore|书店|📚
post office|邮局|📮
station|车站|🚉
airport|机场|🛫
crossing|十字路口|🚸
traffic lights|交通信号灯|🚦
left|左边|⬅️
right|右边|➡️
straight|笔直地|⬆️
north|北方|⬆️
south|南方|⬇️
east|东方|➡️
west|西方|⬅️
hobby|爱好|🎯
idea|主意|💡
story|故事|📖
film|电影|🎬
show|演出；展示|🎭
puzzle|谜；拼图|🧩
club|俱乐部|♣️
reporter|记者|🎤
scientist|科学家|🧑‍🔬
pilot|飞行员|🧑‍✈️
coach|教练|📣
secretary|秘书|⌨️
businessman|商人|💼
factory|工厂|🏭
university|大学|🎓
healthy|健康的|❤️
ill|生病的|🤒
angry|生气的|😠
afraid|害怕的|😨
worried|担心的|😟
excited|兴奋的|🤩
tired|疲倦的|😫
hurt|受伤|🤕
medicine|药|💊
exercise|锻炼|🏋️
deep|深的|🌊
high|高的|⬆️
heavy|重的|🏋️
light|轻的；光|💡
long|长的|↔️
wide|宽的|↔️
fast|快的|⚡
slow|慢的|🐢
different|不同的|🔀
important|重要的|❗
interesting|有趣的|🧐
wonderful|精彩的|✨
dangerous|危险的|⚠️
careful|小心的|🔎`)
  };
}());
