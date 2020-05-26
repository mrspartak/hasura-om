import * as ackeeTracker from 'ackee-tracker'

const tracker = ackeeTracker.create({
    server: 'https://ackee.spartak.io',
    domainId: '84646694-75c6-4d3e-a6d0-0bd0db7089dc'
}, {
    ignoreLocalhost: true,
    detailed: true
})

export default tracker