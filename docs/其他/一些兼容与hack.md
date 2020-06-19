## 浏览器无法自动播放

```javascript
  // NOTE: Stuff to play remote audios due to browsers' new autoplay policy.
  //
  // Just get access to the mic and DO NOT close the mic track for a while.
  // Super hack!
  {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const audioTrack = stream.getAudioTracks()[0]

    audioTrack.enabled = false
    setTimeout(() => audioTrack.stop(), 120000)
  }

```