var scrollish=(function(win,$M){
	var 
		hasTouch = "ontouchstart" in win,
		doc=win.document,
		docEl=doc.documentElement,
		domGet=doc.querySelector,
		instances={},
		vendor="webkit",
		TOUCH="touch",
		MOUSE="mouse",
		events= hasTouch ? {
			start    	: TOUCH+"start",
            move        : TOUCH+"move",
            end         : TOUCH+"end",
            cancel      : TOUCH+"cancel"
        } : {
        	start 		: MOUSE+"down",
            move        : MOUSE+"move",
            end         : MOUSE+"up",
            cancel      : MOUSE+"out",
            wheel		: vendor==='Moz' ? 'DOMMouseScroll' : 'mousewheel'
        },
        eventProp=hasTouch ? function(e){
        	return e.changedTouches[0];
        } : function(e){
        	return e;
        },
        wheelMove,
        bindThis = Function.prototype.bind ? function(func,that){
        	return func.bind(that);
        } : function(func,that){
        	return function(){
        		return func.apply(that,arguments);
        	}
        };
	function getEl(el){
		return typeof el==='string' && domGet.call(doc,el) || el;
	}

	function move(x,y,z){
		this.x=x;
		this.y=y;
		this.z=z;
	}

	move.prototype.toString=function(){
		var coords=[this.x,this.y*100+"%",this.z];
		if(this.translate==="translate"){
			coords.pop();
		}
		return this.translate+"("+coords.join(', ')+")";
	}

	move.prototype.translate="translate";


	function ScrollishEvents(si,touch){

		this.scrollish=si;
		this.el=si.anchor;
		this.base=this.el.offsetHeight;
		//console.log(this.el.offsetHeight);
		this.y=!touch.pageY ? 0 : touch.pageY/this.base;
		this.dy=0;
		this.last=0;
		this.lastDir=1;
		this.dir=1;
		this.count=1;
		this.boundMove=bindThis(this.move,this);
		this.boundEnd=bindThis(this.end,this);
		this.timestamp=Date.now();
		this.frequency=0;

		this.el.addEventListener(events.move,this.boundMove,true,false);
		this.el.addEventListener(events.end,this.boundEnd,true,false);
		//console.log(this,si,touch)
	}

	ScrollishEvents.prototype.move=function(e){
		var delta=(this.y- (!eventProp(e).pageY ? 0 : eventProp(e).pageY/this.base));
		e.preventDefault();
		this.last=this.dy;
		this.dy=this.scrollish.y - delta;
		this.lastDir=this.dir;
		this.dir=this.last > this.dy ? 1 : -1;
		if(this.lastDir!==this.dir){
			this.count=1;
			this.frequency=0;
			this.weight=1;
		}
		this.frequency=(this.frequency + Math.abs((this.dy - this.last)*1000/(e.timeStamp - (this.timestamp||e.timeStamp+1)))/this.count);
		// this.weight=this.dy/
		this.count++;
		console.log(this.dy,this.frequency)
		this.timestamp=e.timeStamp;
		this.scrollish.css.webkitTransform=this.move=(new move(0,(this.dy).toFixed(6),0))+"";
		this.scrollish.css.webkitTransitionDuration= '0ms';

	}
	ScrollishEvents.prototype.end=function(e){
		console.log(this.frequency*this.base,this.base,this.frequency)
		if(this.frequency*this.base*this.dir > 5 ){
			
			this.dy= this.dy - this.frequency || this.dy;
			this.scrollish.css.webkitTransitionDuration= '0ms';
			this.scrollish.css.webkitTransitionDuration= this.frequency*10000+'ms';
			console.log('end',this.dy,this.frequency,this.frequency)
			this.scrollish.css.webkitTransform=(new move(0,(this.dy).toFixed(6),0))+"";
		}
		this.scrollish.y=this.dy;
		this.el.removeEventListener(events.move,this.boundMove,true,false);
		this.el.removeEventListener(events.end,this.boundEnd,true,false)
		this.scrollish.end();
	}

	function Scrollish(el,opts){
		var anchor=this.anchor=getEl(el);

		this.gid=anchor.getAttribute('data-scrollish') || (new Date).getTime();
		this.y=0;
		this.register();
		this.scrollee=anchor.querySelector(':first-child');
		this.css=this.scrollee.style;
		this.originalCss=this.css.cssText;
		this.css.backgroundColor="red";
		anchor.scrollish=this;
		this.init();
	}

	Scrollish.prototype={
		init : function(){
			this.css.webkitTransition=this.css.webkitTransition|| "-webkit-transform 0 cubic-bezier(0, 0, 0.2, 1) 0";
			this.css.webkitTransform=this.css.webkitTransform||new move(0,0,0);
			this.anchor.addEventListener(events.start,this.start,true,false);
			var that=this;
			setTimeout(function(){
				that.wheel();
			},0)
//			this.wheel();
		},
		start : function(e){
			new ScrollishEvents(this.scrollish,eventProp(e));
		},
		end   :	function(){
			//console.log("called end");
			//this.anchor.removeEventListener(events.start,this.start,true,true);
		},
		register : function(){
			var gid=this.gid,
				old=instances[gid];
			if(old && this.anchor){
				this.y=old.y;
				old.destroy();
			}
			instances[gid]=this;
			this.anchor.setAttribute('data-scrollish',this.gid);
		},
		destroy : function(){
			var key,
				anchor=this.anchor;

			delete instances[this.gid];
			if(anchor){
				this.css.cssText=this.css.originalCss;
				anchor.removeAttribute('data-scrollish');
			}
			this.anchor=null;
		}
	}

	if(hasTouch){
		Scrollish.prototype.wheel=function(){};
	}else{
		//wheelMove=ScrollishEvents.prototype.move;
		Scrollish.prototype.wheel=function(op){
			var that=this,
				eh={
					pageY : that.y,
					timeStamp : (new Date()).getTime()
				},
				wheelD=0,
				localMove=new ScrollishEvents(this,eh);
	
			localMove.end(eh);
			this.boundWheel=(function(e){
				wheelD+=e.wheelDeltaY/12;
				eh.pageY= localMove.y + wheelD;
//				that.y=that.y + (5 * (e.wheelDeltaY>0 ? 1 : -1));
				console.log(e.wheelDeltaY,eh)
				localMove.boundMove(eh);
				e.preventDefault()
			});
			this.anchor.addEventListener(events.wheel,this.boundWheel,true,false);
		};
	}
	return {
		create : function(el,opts){
			return new Scrollish(el,opts);
		},

		destroy : function(el){
			var domEl=getEl(el),
				inst=instances[domEl && domEl.getAttribute('data-scrollish')];
			if(inst){
				inst.destroy();
				return true;
			}
			return false;
		}
	}	

})(window,Math)