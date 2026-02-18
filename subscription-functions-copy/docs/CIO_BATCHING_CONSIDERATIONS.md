# Customer.io Webhook: Batching vs Real-Time Processing

## Current Implementation: Real-Time

The current webhook implementation processes each event immediately as it arrives from Customer.io. This provides:

✅ **Immediate data availability** - Events appear in BigQuery within seconds  
✅ **Simple architecture** - No queue or buffer system needed  
✅ **Low latency** - No delay waiting for batch windows  
✅ **Easy debugging** - Can see individual events as they process  

## When to Consider Batching

### 1. **Cost Optimization**

**Current**: Each event = 1 BigQuery query  
**Batched**: 100 events = 1 BigQuery query (100x reduction)

**Break-even point**: 
- Real-time: 10,000 events/day = 10,000 queries/day
- Batched (100 per batch): 10,000 events/day = 100 queries/day
- **Savings**: ~99% reduction in query costs

**Recommendation**: Consider batching if processing >5,000 events/day regularly

### 2. **Rate Limiting**

BigQuery has quotas:
- **100 concurrent queries** per project
- **1,000 queries per 10 seconds** per project
- **1,000 queries per 100 seconds** per user

**Risk scenario**: Large campaign sends 5,000 emails → 5,000 webhook events in 1 minute → Could hit rate limits

**Batching solution**: Buffer events for 10-30 seconds, then batch insert

### 3. **Performance at Scale**

**Real-time**: 1,000 events = 1,000 individual MERGE operations  
**Batched**: 1,000 events = 10 batch inserts (100 events each)

**Performance gain**: Batch inserts are 5-10x faster than individual inserts

### 4. **Reliability & Retry Logic**

**Current**: If BigQuery is temporarily unavailable, events are lost (webhook returns error)

**Batched with queue**:
- Events stored in queue (Cloud Tasks, Pub/Sub, or in-memory buffer)
- Automatic retries on failure
- Dead letter queue for permanently failed events
- Better handling of temporary outages

### 5. **Backfill Scenarios**

If you need to:
- Reprocess historical data
- Recover from downtime
- Import data from Customer.io API

Batching is more efficient than processing one-by-one.

## Implementation Options

### Option 1: Simple In-Memory Batching (Easiest)

Buffer events in memory for 10-30 seconds, then batch insert:

```javascript
// Pseudo-code
const eventBuffer = [];
const BATCH_SIZE = 100;
const BATCH_INTERVAL = 10000; // 10 seconds

async function handleWebhook(event) {
  eventBuffer.push(event);
  
  if (eventBuffer.length >= BATCH_SIZE) {
    await processBatch(eventBuffer);
    eventBuffer.length = 0;
  }
}

// Process batch every 10 seconds
setInterval(async () => {
  if (eventBuffer.length > 0) {
    await processBatch(eventBuffer);
    eventBuffer.length = 0;
  }
}, BATCH_INTERVAL);
```

**Pros**: Simple, no external dependencies  
**Cons**: Events lost if serverless function times out, no persistence

### Option 2: Cloud Tasks Queue (Recommended for Production)

Use Google Cloud Tasks to queue events, then process in batches:

```javascript
// Webhook receives event → enqueue to Cloud Tasks
await cloudTasks.createTask({
  queue: 'cio-webhook-queue',
  task: { data: eventData }
});

// Separate function processes queue in batches
async function processBatch() {
  const tasks = await cloudTasks.leaseTasks({ maxTasks: 100 });
  const events = tasks.map(t => t.data);
  await batchInsertToBigQuery(events);
}
```

**Pros**: Persistent queue, automatic retries, scalable  
**Cons**: More complex setup, additional service

### Option 3: Pub/Sub (Most Scalable)

Use Pub/Sub for event streaming, then batch process:

```javascript
// Webhook publishes to Pub/Sub
await pubsub.topic('cio-events').publish(eventData);

// Separate subscriber batches and inserts
async function subscriber() {
  const messages = await pubsub.pull({ maxMessages: 100 });
  await batchInsertToBigQuery(messages);
}
```

**Pros**: Highly scalable, built-in retry logic, can handle millions of events  
**Cons**: Most complex, requires Pub/Sub setup

## Hybrid Approach (Recommended)

Keep real-time for low-volume periods, switch to batching during high-volume campaigns:

```javascript
const EVENT_RATE_THRESHOLD = 100; // events per minute
let currentRate = 0;

async function handleWebhook(event) {
  currentRate = calculateCurrentRate();
  
  if (currentRate > EVENT_RATE_THRESHOLD) {
    // High volume → batch
    await enqueueForBatching(event);
  } else {
    // Low volume → real-time
    await processImmediately(event);
  }
}
```

## Monitoring Metrics

Track these to decide when to switch to batching:

1. **Events per day**: >5,000 = consider batching
2. **BigQuery query costs**: Monitor in Cloud Console
3. **Rate limit errors**: If you see 429 errors, need batching
4. **Processing latency**: If real-time is slow, batching might help
5. **Failed events**: If many events fail, batching with retry helps

## Recommendation

**Current state**: Real-time is fine for your current volume

**Switch to batching when**:
- Processing >5,000 events/day regularly
- Seeing BigQuery rate limit errors
- Want better reliability/retry handling
- Want to reduce costs

**Implementation priority**:
1. ✅ Keep real-time (current)
2. ⚠️ Monitor volume and costs
3. 🔄 Add simple in-memory batching if volume grows
4. 🚀 Move to Cloud Tasks/Pub/Sub if scale requires it

## Cost Comparison Example

**Scenario**: 10,000 email events per day

**Real-time**:
- 10,000 BigQuery queries/day
- ~$0.50/day (at $0.05 per 1,000 queries)
- ~$15/month

**Batched (100 per batch)**:
- 100 BigQuery queries/day
- ~$0.005/day
- ~$0.15/month

**Savings**: ~99% reduction in query costs




