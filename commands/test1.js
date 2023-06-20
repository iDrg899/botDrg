module.exports = {
    name: 'test1',
    description: 'sends [o][u][o]',
    execute(message, args){
        message.channel.send('[o][u][o]');
    }
}