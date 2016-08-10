
	function CloudSpritePool(){
	this.createWindows()
	}
	CloudSpritePool.prototype.borrowWindow = function() {
  return this.windows.shift();
	};
	
	CloudSpritePool.prototype.returnWindow = function(sprite) {
	this.windows.push(sprite);
	};
	
	CloudSpritePool.prototype.createWindows = function() {
	this.windows=[];
	
	this.addCloudSprites(6,'cloud_pixel.png')

	this.shuffle(this.windows);
	};
	CloudSpritePool.prototype.addCloudSprites = function(amount, frameId) {
  for (var i = 0; i < amount; i++)
  {
    var sprite = PIXI.Sprite.fromFrame(frameId);
    this.windows.push(sprite);
  }
};
	
	CloudSpritePool.prototype.shuffle = function(array) {
  var len = array.length;
  var shuffles = len * 3;
  for (var i = 0; i < shuffles; i++)
  {
    var wallSlice = array.pop();
    var pos = Math.floor(Math.random() * (len-1));
    array.splice(pos, 0, wallSlice);
  }
};
	</script>
	</body>
</html>