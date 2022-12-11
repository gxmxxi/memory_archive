(function(window, angular){
"use strict";

var memoApp = angular.module("memoApp", []);

memoApp.controller("memoCtrl", ["$scope", function($scope){
	// controller
}]);

memoApp.directive("memoDrct", ["$timeout", function($timeout){
	return {
		link : function($scope, el, attrs){
			
			$scope.memoList = [];
			$scope.currentMemo = null;
			var origin = {};
			var colorCount = 8;
			var padding = 20;
			var min_w = 200;
			var min_h = 100;
			
			/**
			 * start memo directive
			 */
			function startDirective(){
				$scope.contVisible = true;

				var str = localStorage.getItem("myMemo");
				if(str == null){ return; }
				var list = JSON.parse(str);
				if(!angular.isArray(list)){ return; }

				$scope.memoList = list;
			};

			/**
			 * make 2-digit number
			 * @param n - number to make 2-digit
			 */
			function get2Digit(n){
				return n < 10 ? "0" + n : n;
			};
			
			/**
			 * make date string
			 * @param date - date object
			 */
			function getDateStr(date){
				var str = "";
				str = date.getFullYear() + "." + get2Digit(date.getMonth() + 1) + "." + get2Digit(date.getDate());
				str += " " + get2Digit(date.getHours()) + ":" + get2Digit(date.getMinutes()) + ":" + get2Digit(date.getSeconds())
				return str;
			};
			
			/**
			 * deselect memo
			 */
			$scope.resetCurrentMemo = function($e){
				if(angular.element($e.target).hasClass("wrapper")){
					$scope.currentMemo = null;
				}
			};
			
			/**
			 * add new memo
			 */
			$scope.addMemo = function(){
				var date = new Date();
				var dt = date.getTime();
				var dstr = getDateStr(date);
				var w = 300;
				var h = 200;
				var x = (angular.element(window).width() - 300) / 2;
				var y = (angular.element(window).height() - 200) / 2;
				var c = Math.ceil(Math.random() * colorCount);
				var z = $scope.memoList.length + 1;
				var item = {
					"cont"	: "memo text",
					"dt"	: dt,
					"dstr"	: dstr,
					"x"		: x,
					"y"		: y,
					"w"		: w,
					"h"		: h,
					"c"		: c,
					"z"		: z
				};
				$scope.memoList.push(item);
				$scope.currentMemo = item;

				saveMemo();
			};

			/**
			 * bring selected memo to top
			 * @param item - memo object
			 */
			$scope.updateZindex = function(item){
				var z = item.z;
				angular.forEach($scope.memoList, function(itm, idx){
					if(itm.z > z){
						itm.z--;
					}
				});
				$timeout(function(){
					item.z = $scope.memoList.length;
					saveMemo();
				}, 0);
				
				$scope.currentMemo = item;
			};
			
			/**
			 * mousedown event handler
			 * @param $e - event object
			 * @param item - memo object
			 * @param act - action to apply
			 */
			$scope.dragStart = function($e, item, act){
				var e = $e.originalEvent;
				e.preventDefault();
				
				var doc = angular.element(document);
				doc.unbind("mousemove mouseup");
				doc.bind("mousemove", dragging);
				doc.bind("mouseup", dragEnd);
				
				origin.act	= act;
				origin.item	= item;
				origin.cx	= e.clientX;
				origin.cy	= e.clientY;
				origin.x	= item.x;
				origin.y	= item.y;
				origin.w	= item.w;
				origin.h	= item.h;
			};

			/**
			 * mousemove event handler
			 */
			function dragging($e){
				var e = $e.originalEvent;
				e.preventDefault;

				var item = origin.item;
				var dx = e.clientX - origin.cx;
				var dy = e.clientY - origin.cy;
				$timeout(function(){
					var doc = angular.element(document);
					var x, y, w, h, x2, y2, X, Y;
					X = doc.width() - padding;
					Y = doc.height() - padding;
					
					if(origin.act == "move"){
						x = origin.x + dx;
						y = origin.y + dy;
						w = origin.w;
						h = origin.h;
						x2 = x + w;
						y2 = y + h;
						
						if(x < padding){ x = padding; }
						if(y < padding){ y = padding; }
						if(x2 > X){ x = X - w; }
						if(y2 > Y){ y = Y - h; }
						
						item.x = x;
						item.y = y;
					}else{
						w = origin.w + dx;
						h = origin.h + dy;
						x = origin.x;
						y = origin.y;
						x2 = x + w;
						y2 = y + h;
						
						if(w < min_w){ w = min_w; }
						if(h < min_h){ h = min_h; }
						if(x2 > X){ w = X - x; }
						if(y2 > Y){ h = Y - y; }
						
						item.w = w;
						item.h = h;
					}
				}, 0);
			};

			/**
			 * mouseup event handler
			 */
			function dragEnd($e){
				angular.element(document).unbind("mousemove mouseup");
				saveMemo();
			};


			/**
			 * textarea focus event handler
			 */
			$scope.memoFocus = function(item){
				origin.cont = item.cont;
			};

			/**
			 * textarea blur event handler
			 */
			$scope.memoBlur = function(item){
				if(origin.cont != item.cont){
					var date = new Date();
					item.dt = date.getTime();
					item.dstr = getDateStr(date);

					saveMemo();
				}
			};

			/**
			 * delete memo
			 * @param item - memo object
			 */
			$scope.deleteMemo = function(item){
				var rtn = confirm("기억을 지우시겠습니까?");

				if(rtn){
					var i, itm;
					var len = $scope.memoList.length;
					for(i=0; i<len; i++){
						itm = $scope.memoList[i];
						if(itm.cont == item.cont && itm.dt == item.dt){
							$scope.memoList.splice(i, 1);
							break;
						}
					}
					saveMemo();
				}
			};

			/**
			 * save memo data to localStorage
			 */
			function saveMemo(){
				var arr = [].concat($scope.memoList);
				angular.forEach(arr, function(itm){
					delete itm.$$hashKey;
				});
				
				var str = JSON.stringify(arr);
				localStorage.setItem("myMemo", str);
			};
			
			
			// start memo directive
			startDirective();
			
		}// link
	}
}]);

})(window, window.angular);