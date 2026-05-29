var diff_match_patch=function(){this.Diff_Timeout=1;this.Diff_EditCost=4;this.Match_Threshold=.5;this.Match_Distance=1E3;this.Patch_DeleteThreshold=.5;this.Patch_Margin=4;this.Match_MaxBits=32},DIFF_DELETE=-1,DIFF_INSERT=1,DIFF_EQUAL=0;diff_match_patch.Diff=function(a,b){this[0]=a;this[1]=b};diff_match_patch.Diff.prototype.length=2;diff_match_patch.Diff.prototype.toString=function(){return this[0]+","+this[1]};
diff_match_patch.prototype.diff_main=function(a,b,c,d){"undefined"==typeof d&&(d=0>=this.Diff_Timeout?Number.MAX_VALUE:(new Date).getTime()+1E3*this.Diff_Timeout);if(null==a||null==b)throw Error("Null input. (diff_main)");if(a==b)return a?[new diff_match_patch.Diff(DIFF_EQUAL,a)]:[];"undefined"==typeof c&&(c=!0);var e=c,f=this.diff_commonPrefix(a,b);c=a.substring(0,f);a=a.substring(f);b=b.substring(f);f=this.diff_commonSuffix(a,b);var g=a.substring(a.length-f);a=a.substring(0,a.length-f);b=b.substring(0,
b.length-f);a=this.diff_compute_(a,b,e,d);c&&a.unshift(new diff_match_patch.Diff(DIFF_EQUAL,c));g&&a.push(new diff_match_patch.Diff(DIFF_EQUAL,g));this.diff_cleanupMerge(a);return a};
diff_match_patch.prototype.diff_compute_=function(a,b,c,d){if(!a)return[new diff_match_patch.Diff(DIFF_INSERT,b)];if(!b)return[new diff_match_patch.Diff(DIFF_DELETE,a)];var e=a.length>b.length?a:b,f=a.length>b.length?b:a,g=e.indexOf(f);return-1!=g?(c=[new diff_match_patch.Diff(DIFF_INSERT,e.substring(0,g)),new diff_match_patch.Diff(DIFF_EQUAL,f),new diff_match_patch.Diff(DIFF_INSERT,e.substring(g+f.length))],a.length>b.length&&(c[0][0]=c[2][0]=DIFF_DELETE),c):1==f.length?[new diff_match_patch.Diff(DIFF_DELETE,
a),new diff_match_patch.Diff(DIFF_INSERT,b)]:(e=this.diff_halfMatch_(a,b))?(b=e[1],f=e[3],a=e[4],e=this.diff_main(e[0],e[2],c,d),c=this.diff_main(b,f,c,d),e.concat([new diff_match_patch.Diff(DIFF_EQUAL,a)],c)):c&&100<a.length&&100<b.length?this.diff_lineMode_(a,b,d):this.diff_bisect_(a,b,d)};
diff_match_patch.prototype.diff_lineMode_=function(a,b,c){var d=this.diff_linesToChars_(a,b);a=d.chars1;b=d.chars2;d=d.lineArray;a=this.diff_main(a,b,!1,c);this.diff_charsToLines_(a,d);this.diff_cleanupSemantic(a);a.push(new diff_match_patch.Diff(DIFF_EQUAL,""));for(var e=d=b=0,f="",g="";b<a.length;){switch(a[b][0]){case DIFF_INSERT:e++;g+=a[b][1];break;case DIFF_DELETE:d++;f+=a[b][1];break;case DIFF_EQUAL:if(1<=d&&1<=e){a.splice(b-d-e,d+e);b=b-d-e;d=this.diff_main(f,g,!1,c);for(e=d.length-1;0<=e;e--)a.splice(b,
0,d[e]);b+=d.length}d=e=0;g=f=""}b++}a.pop();return a};
diff_match_patch.prototype.diff_bisect_=function(a,b,c){for(var d=a.length,e=b.length,f=Math.ceil((d+e)/2),g=2*f,h=Array(g),l=Array(g),k=0;k<g;k++)h[k]=-1,l[k]=-1;h[f+1]=0;l[f+1]=0;k=d-e;for(var m=0!=k%2,p=0,x=0,w=0,q=0,t=0;t<f&&!((new Date).getTime()>c);t++){for(var v=-t+p;v<=t-x;v+=2){var n=f+v;var r=v==-t||v!=t&&h[n-1]<h[n+1]?h[n+1]:h[n-1]+1;for(var y=r-v;r<d&&y<e&&a.charAt(r)==b.charAt(y);)r++,y++;h[n]=r;if(r>d)x+=2;else if(y>e)p+=2;else if(m&&(n=f+k-v,0<=n&&n<g&&-1!=l[n])){var u=d-l[n];if(r>=
u)return this.diff_bisectSplit_(a,b,r,y,c)}}for(v=-t+w;v<=t-q;v+=2){n=f+v;u=v==-t||v!=t&&l[n-1]<l[n+1]?l[n+1]:l[n-1]+1;for(r=u-v;u<d&&r<e&&a.charAt(d-u-1)==b.charAt(e-r-1);)u++,r++;l[n]=u;if(u>d)q+=2;else if(r>e)w+=2;else if(!m&&(n=f+k-v,0<=n&&n<g&&-1!=h[n]&&(r=h[n],y=f+r-n,u=d-u,r>=u)))return this.diff_bisectSplit_(a,b,r,y,c)}}return[new diff_match_patch.Diff(DIFF_DELETE,a),new diff_match_patch.Diff(DIFF_INSERT,b)]};
diff_match_patch.prototype.diff_bisectSplit_=function(a,b,c,d,e){var f=a.substring(0,c),g=b.substring(0,d);a=a.substring(c);b=b.substring(d);f=this.diff_main(f,g,!1,e);e=this.diff_main(a,b,!1,e);return f.concat(e)};
diff_match_patch.prototype.diff_linesToChars_=function(a,b){function c(a){for(var b="",c=0,g=-1,h=d.length;g<a.length-1;){g=a.indexOf("\n",c);-1==g&&(g=a.length-1);var l=a.substring(c,g+1);(e.hasOwnProperty?e.hasOwnProperty(l):void 0!==e[l])?b+=String.fromCharCode(e[l]):(h==f&&(l=a.substring(c),g=a.length),b+=String.fromCharCode(h),e[l]=h,d[h++]=l);c=g+1}return b}var d=[],e={};d[0]="";var f=4E4,g=c(a);f=65535;var h=c(b);return{chars1:g,chars2:h,lineArray:d}};
diff_match_patch.prototype.diff_charsToLines_=function(a,b){for(var c=0;c<a.length;c++){for(var d=a[c][1],e=[],f=0;f<d.length;f++)e[f]=b[d.charCodeAt(f)];a[c][1]=e.join("")}};diff_match_patch.prototype.diff_commonPrefix=function(a,b){if(!a||!b||a.charAt(0)!=b.charAt(0))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(f,e)==b.substring(f,e)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e};
diff_match_patch.prototype.diff_commonSuffix=function(a,b){if(!a||!b||a.charAt(a.length-1)!=b.charAt(b.length-1))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(a.length-e,a.length-f)==b.substring(b.length-e,b.length-f)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e};
diff_match_patch.prototype.diff_commonOverlap_=function(a,b){var c=a.length,d=b.length;if(0==c||0==d)return 0;c>d?a=a.substring(c-d):c<d&&(b=b.substring(0,c));c=Math.min(c,d);if(a==b)return c;d=0;for(var e=1;;){var f=a.substring(c-e);f=b.indexOf(f);if(-1==f)return d;e+=f;if(0==f||a.substring(c-e)==b.substring(0,e))d=e,e++}};
diff_match_patch.prototype.diff_halfMatch_=function(a,b){function c(a,b,c){for(var d=a.substring(c,c+Math.floor(a.length/4)),e=-1,g="",h,k,l,m;-1!=(e=b.indexOf(d,e+1));){var p=f.diff_commonPrefix(a.substring(c),b.substring(e)),u=f.diff_commonSuffix(a.substring(0,c),b.substring(0,e));g.length<u+p&&(g=b.substring(e-u,e)+b.substring(e,e+p),h=a.substring(0,c-u),k=a.substring(c+p),l=b.substring(0,e-u),m=b.substring(e+p))}return 2*g.length>=a.length?[h,k,l,m,g]:null}if(0>=this.Diff_Timeout)return null;
var d=a.length>b.length?a:b,e=a.length>b.length?b:a;if(4>d.length||2*e.length<d.length)return null;var f=this,g=c(d,e,Math.ceil(d.length/4));d=c(d,e,Math.ceil(d.length/2));if(g||d)g=d?g?g[4].length>d[4].length?g:d:d:g;else return null;if(a.length>b.length){d=g[0];e=g[1];var h=g[2];var l=g[3]}else h=g[0],l=g[1],d=g[2],e=g[3];return[d,e,h,l,g[4]]};
diff_match_patch.prototype.diff_cleanupSemantic=function(a){for(var b=!1,c=[],d=0,e=null,f=0,g=0,h=0,l=0,k=0;f<a.length;)a[f][0]==DIFF_EQUAL?(c[d++]=f,g=l,h=k,k=l=0,e=a[f][1]):(a[f][0]==DIFF_INSERT?l+=a[f][1].length:k+=a[f][1].length,e&&e.length<=Math.max(g,h)&&e.length<=Math.max(l,k)&&(a.splice(c[d-1],0,new diff_match_patch.Diff(DIFF_DELETE,e)),a[c[d-1]+1][0]=DIFF_INSERT,d--,d--,f=0<d?c[d-1]:-1,k=l=h=g=0,e=null,b=!0)),f++;b&&this.diff_cleanupMerge(a);this.diff_cleanupSemanticLossless(a);for(f=1;f<
a.length;){if(a[f-1][0]==DIFF_DELETE&&a[f][0]==DIFF_INSERT){b=a[f-1][1];c=a[f][1];d=this.diff_commonOverlap_(b,c);e=this.diff_commonOverlap_(c,b);if(d>=e){if(d>=b.length/2||d>=c.length/2)a.splice(f,0,new diff_match_patch.Diff(DIFF_EQUAL,c.substring(0,d))),a[f-1][1]=b.substring(0,b.length-d),a[f+1][1]=c.substring(d),f++}else if(e>=b.length/2||e>=c.length/2)a.splice(f,0,new diff_match_patch.Diff(DIFF_EQUAL,b.substring(0,e))),a[f-1][0]=DIFF_INSERT,a[f-1][1]=c.substring(0,c.length-e),a[f+1][0]=DIFF_DELETE,
a[f+1][1]=b.substring(e),f++;f++}f++}};
diff_match_patch.prototype.diff_cleanupSemanticLossless=function(a){function b(a,b){if(!a||!b)return 6;var c=a.charAt(a.length-1),d=b.charAt(0),e=c.match(diff_match_patch.nonAlphaNumericRegex_),f=d.match(diff_match_patch.nonAlphaNumericRegex_),g=e&&c.match(diff_match_patch.whitespaceRegex_),h=f&&d.match(diff_match_patch.whitespaceRegex_);c=g&&c.match(diff_match_patch.linebreakRegex_);d=h&&d.match(diff_match_patch.linebreakRegex_);var k=c&&a.match(diff_match_patch.blanklineEndRegex_),l=d&&b.match(diff_match_patch.blanklineStartRegex_);
return k||l?5:c||d?4:e&&!g&&h?3:g||h?2:e||f?1:0}for(var c=1;c<a.length-1;){if(a[c-1][0]==DIFF_EQUAL&&a[c+1][0]==DIFF_EQUAL){var d=a[c-1][1],e=a[c][1],f=a[c+1][1],g=this.diff_commonSuffix(d,e);if(g){var h=e.substring(e.length-g);d=d.substring(0,d.length-g);e=h+e.substring(0,e.length-g);f=h+f}g=d;h=e;for(var l=f,k=b(d,e)+b(e,f);e.charAt(0)===f.charAt(0);){d+=e.charAt(0);e=e.substring(1)+f.charAt(0);f=f.substring(1);var m=b(d,e)+b(e,f);m>=k&&(k=m,g=d,h=e,l=f)}a[c-1][1]!=g&&(g?a[c-1][1]=g:(a.splice(c-
1,1),c--),a[c][1]=h,l?a[c+1][1]=l:(a.splice(c+1,1),c--))}c++}};diff_match_patch.nonAlphaNumericRegex_=/[^a-zA-Z0-9]/;diff_match_patch.whitespaceRegex_=/\s/;diff_match_patch.linebreakRegex_=/[\r\n]/;diff_match_patch.blanklineEndRegex_=/\n\r?\n$/;diff_match_patch.blanklineStartRegex_=/^\r?\n\r?\n/;
diff_match_patch.prototype.diff_cleanupEfficiency=function(a){for(var b=!1,c=[],d=0,e=null,f=0,g=!1,h=!1,l=!1,k=!1;f<a.length;)a[f][0]==DIFF_EQUAL?(a[f][1].length<this.Diff_EditCost&&(l||k)?(c[d++]=f,g=l,h=k,e=a[f][1]):(d=0,e=null),l=k=!1):(a[f][0]==DIFF_DELETE?k=!0:l=!0,e&&(g&&h&&l&&k||e.length<this.Diff_EditCost/2&&3==g+h+l+k)&&(a.splice(c[d-1],0,new diff_match_patch.Diff(DIFF_DELETE,e)),a[c[d-1]+1][0]=DIFF_INSERT,d--,e=null,g&&h?(l=k=!0,d=0):(d--,f=0<d?c[d-1]:-1,l=k=!1),b=!0)),f++;b&&this.diff_cleanupMerge(a)};
diff_match_patch.prototype.diff_cleanupMerge=function(a){a.push(new diff_match_patch.Diff(DIFF_EQUAL,""));for(var b=0,c=0,d=0,e="",f="",g;b<a.length;)switch(a[b][0]){case DIFF_INSERT:d++;f+=a[b][1];b++;break;case DIFF_DELETE:c++;e+=a[b][1];b++;break;case DIFF_EQUAL:1<c+d?(0!==c&&0!==d&&(g=this.diff_commonPrefix(f,e),0!==g&&(0<b-c-d&&a[b-c-d-1][0]==DIFF_EQUAL?a[b-c-d-1][1]+=f.substring(0,g):(a.splice(0,0,new diff_match_patch.Diff(DIFF_EQUAL,f.substring(0,g))),b++),f=f.substring(g),e=e.substring(g)),
g=this.diff_commonSuffix(f,e),0!==g&&(a[b][1]=f.substring(f.length-g)+a[b][1],f=f.substring(0,f.length-g),e=e.substring(0,e.length-g))),b-=c+d,a.splice(b,c+d),e.length&&(a.splice(b,0,new diff_match_patch.Diff(DIFF_DELETE,e)),b++),f.length&&(a.splice(b,0,new diff_match_patch.Diff(DIFF_INSERT,f)),b++),b++):0!==b&&a[b-1][0]==DIFF_EQUAL?(a[b-1][1]+=a[b][1],a.splice(b,1)):b++,c=d=0,f=e=""}""===a[a.length-1][1]&&a.pop();c=!1;for(b=1;b<a.length-1;)a[b-1][0]==DIFF_EQUAL&&a[b+1][0]==DIFF_EQUAL&&(a[b][1].substring(a[b][1].length-
a[b-1][1].length)==a[b-1][1]?(a[b][1]=a[b-1][1]+a[b][1].substring(0,a[b][1].length-a[b-1][1].length),a[b+1][1]=a[b-1][1]+a[b+1][1],a.splice(b-1,1),c=!0):a[b][1].substring(0,a[b+1][1].length)==a[b+1][1]&&(a[b-1][1]+=a[b+1][1],a[b][1]=a[b][1].substring(a[b+1][1].length)+a[b+1][1],a.splice(b+1,1),c=!0)),b++;c&&this.diff_cleanupMerge(a)};
diff_match_patch.prototype.diff_xIndex=function(a,b){var c=0,d=0,e=0,f=0,g;for(g=0;g<a.length;g++){a[g][0]!==DIFF_INSERT&&(c+=a[g][1].length);a[g][0]!==DIFF_DELETE&&(d+=a[g][1].length);if(c>b)break;e=c;f=d}return a.length!=g&&a[g][0]===DIFF_DELETE?f:f+(b-e)};
diff_match_patch.prototype.diff_prettyHtml=function(a){for(var b=[],c=/&/g,d=/</g,e=/>/g,f=/\n/g,g=0;g<a.length;g++){var h=a[g][0],l=a[g][1].replace(c,"&amp;").replace(d,"&lt;").replace(e,"&gt;").replace(f,"&para;<br>");switch(h){case DIFF_INSERT:b[g]='<ins style="background:#e6ffe6;">'+l+"</ins>";break;case DIFF_DELETE:b[g]='<del style="background:#ffe6e6;">'+l+"</del>";break;case DIFF_EQUAL:b[g]="<span>"+l+"</span>"}}return b.join("")};
diff_match_patch.prototype.diff_text1=function(a){for(var b=[],c=0;c<a.length;c++)a[c][0]!==DIFF_INSERT&&(b[c]=a[c][1]);return b.join("")};diff_match_patch.prototype.diff_text2=function(a){for(var b=[],c=0;c<a.length;c++)a[c][0]!==DIFF_DELETE&&(b[c]=a[c][1]);return b.join("")};
diff_match_patch.prototype.diff_levenshtein=function(a){for(var b=0,c=0,d=0,e=0;e<a.length;e++){var f=a[e][1];switch(a[e][0]){case DIFF_INSERT:c+=f.length;break;case DIFF_DELETE:d+=f.length;break;case DIFF_EQUAL:b+=Math.max(c,d),d=c=0}}return b+=Math.max(c,d)};
diff_match_patch.prototype.diff_toDelta=function(a){for(var b=[],c=0;c<a.length;c++)switch(a[c][0]){case DIFF_INSERT:b[c]="+"+encodeURI(a[c][1]);break;case DIFF_DELETE:b[c]="-"+a[c][1].length;break;case DIFF_EQUAL:b[c]="="+a[c][1].length}return b.join("\t").replace(/%20/g," ")};
diff_match_patch.prototype.diff_fromDelta=function(a,b){for(var c=[],d=0,e=0,f=b.split(/\t/g),g=0;g<f.length;g++){var h=f[g].substring(1);switch(f[g].charAt(0)){case "+":try{c[d++]=new diff_match_patch.Diff(DIFF_INSERT,decodeURI(h))}catch(k){throw Error("Illegal escape in diff_fromDelta: "+h);}break;case "-":case "=":var l=parseInt(h,10);if(isNaN(l)||0>l)throw Error("Invalid number in diff_fromDelta: "+h);h=a.substring(e,e+=l);"="==f[g].charAt(0)?c[d++]=new diff_match_patch.Diff(DIFF_EQUAL,h):c[d++]=
new diff_match_patch.Diff(DIFF_DELETE,h);break;default:if(f[g])throw Error("Invalid diff operation in diff_fromDelta: "+f[g]);}}if(e!=a.length)throw Error("Delta length ("+e+") does not equal source text length ("+a.length+").");return c};diff_match_patch.prototype.match_main=function(a,b,c){if(null==a||null==b||null==c)throw Error("Null input. (match_main)");c=Math.max(0,Math.min(c,a.length));return a==b?0:a.length?a.substring(c,c+b.length)==b?c:this.match_bitap_(a,b,c):-1};
diff_match_patch.prototype.match_bitap_=function(a,b,c){function d(a,d){var e=a/b.length,g=Math.abs(c-d);return f.Match_Distance?e+g/f.Match_Distance:g?1:e}if(b.length>this.Match_MaxBits)throw Error("Pattern too long for this browser.");var e=this.match_alphabet_(b),f=this,g=this.Match_Threshold,h=a.indexOf(b,c);-1!=h&&(g=Math.min(d(0,h),g),h=a.lastIndexOf(b,c+b.length),-1!=h&&(g=Math.min(d(0,h),g)));var l=1<<b.length-1;h=-1;for(var k,m,p=b.length+a.length,x,w=0;w<b.length;w++){k=0;for(m=p;k<m;)d(w,
c+m)<=g?k=m:p=m,m=Math.floor((p-k)/2+k);p=m;k=Math.max(1,c-m+1);var q=Math.min(c+m,a.length)+b.length;m=Array(q+2);for(m[q+1]=(1<<w)-1;q>=k;q--){var t=e[a.charAt(q-1)];m[q]=0===w?(m[q+1]<<1|1)&t:(m[q+1]<<1|1)&t|(x[q+1]|x[q])<<1|1|x[q+1];if(m[q]&l&&(t=d(w,q-1),t<=g))if(g=t,h=q-1,h>c)k=Math.max(1,2*c-h);else break}if(d(w+1,c)>g)break;x=m}return h};
diff_match_patch.prototype.match_alphabet_=function(a){for(var b={},c=0;c<a.length;c++)b[a.charAt(c)]=0;for(c=0;c<a.length;c++)b[a.charAt(c)]|=1<<a.length-c-1;return b};
diff_match_patch.prototype.patch_addContext_=function(a,b){if(0!=b.length){if(null===a.start2)throw Error("patch not initialized");for(var c=b.substring(a.start2,a.start2+a.length1),d=0;b.indexOf(c)!=b.lastIndexOf(c)&&c.length<this.Match_MaxBits-this.Patch_Margin-this.Patch_Margin;)d+=this.Patch_Margin,c=b.substring(a.start2-d,a.start2+a.length1+d);d+=this.Patch_Margin;(c=b.substring(a.start2-d,a.start2))&&a.diffs.unshift(new diff_match_patch.Diff(DIFF_EQUAL,c));(d=b.substring(a.start2+a.length1,
a.start2+a.length1+d))&&a.diffs.push(new diff_match_patch.Diff(DIFF_EQUAL,d));a.start1-=c.length;a.start2-=c.length;a.length1+=c.length+d.length;a.length2+=c.length+d.length}};
diff_match_patch.prototype.patch_make=function(a,b,c){if("string"==typeof a&&"string"==typeof b&&"undefined"==typeof c){var d=a;b=this.diff_main(d,b,!0);2<b.length&&(this.diff_cleanupSemantic(b),this.diff_cleanupEfficiency(b))}else if(a&&"object"==typeof a&&"undefined"==typeof b&&"undefined"==typeof c)b=a,d=this.diff_text1(b);else if("string"==typeof a&&b&&"object"==typeof b&&"undefined"==typeof c)d=a;else if("string"==typeof a&&"string"==typeof b&&c&&"object"==typeof c)d=a,b=c;else throw Error("Unknown call format to patch_make.");
if(0===b.length)return[];c=[];a=new diff_match_patch.patch_obj;for(var e=0,f=0,g=0,h=d,l=0;l<b.length;l++){var k=b[l][0],m=b[l][1];e||k===DIFF_EQUAL||(a.start1=f,a.start2=g);switch(k){case DIFF_INSERT:a.diffs[e++]=b[l];a.length2+=m.length;d=d.substring(0,g)+m+d.substring(g);break;case DIFF_DELETE:a.length1+=m.length;a.diffs[e++]=b[l];d=d.substring(0,g)+d.substring(g+m.length);break;case DIFF_EQUAL:m.length<=2*this.Patch_Margin&&e&&b.length!=l+1?(a.diffs[e++]=b[l],a.length1+=m.length,a.length2+=m.length):
m.length>=2*this.Patch_Margin&&e&&(this.patch_addContext_(a,h),c.push(a),a=new diff_match_patch.patch_obj,e=0,h=d,f=g)}k!==DIFF_INSERT&&(f+=m.length);k!==DIFF_DELETE&&(g+=m.length)}e&&(this.patch_addContext_(a,h),c.push(a));return c};
diff_match_patch.prototype.patch_deepCopy=function(a){for(var b=[],c=0;c<a.length;c++){var d=a[c],e=new diff_match_patch.patch_obj;e.diffs=[];for(var f=0;f<d.diffs.length;f++)e.diffs[f]=new diff_match_patch.Diff(d.diffs[f][0],d.diffs[f][1]);e.start1=d.start1;e.start2=d.start2;e.length1=d.length1;e.length2=d.length2;b[c]=e}return b};
diff_match_patch.prototype.patch_apply=function(a,b){if(0==a.length)return[b,[]];a=this.patch_deepCopy(a);var c=this.patch_addPadding(a);b=c+b+c;this.patch_splitMax(a);for(var d=0,e=[],f=0;f<a.length;f++){var g=a[f].start2+d,h=this.diff_text1(a[f].diffs),l=-1;if(h.length>this.Match_MaxBits){var k=this.match_main(b,h.substring(0,this.Match_MaxBits),g);-1!=k&&(l=this.match_main(b,h.substring(h.length-this.Match_MaxBits),g+h.length-this.Match_MaxBits),-1==l||k>=l)&&(k=-1)}else k=this.match_main(b,h,
g);if(-1==k)e[f]=!1,d-=a[f].length2-a[f].length1;else if(e[f]=!0,d=k-g,g=-1==l?b.substring(k,k+h.length):b.substring(k,l+this.Match_MaxBits),h==g)b=b.substring(0,k)+this.diff_text2(a[f].diffs)+b.substring(k+h.length);else if(g=this.diff_main(h,g,!1),h.length>this.Match_MaxBits&&this.diff_levenshtein(g)/h.length>this.Patch_DeleteThreshold)e[f]=!1;else{this.diff_cleanupSemanticLossless(g);h=0;var m;for(l=0;l<a[f].diffs.length;l++){var p=a[f].diffs[l];p[0]!==DIFF_EQUAL&&(m=this.diff_xIndex(g,h));p[0]===
DIFF_INSERT?b=b.substring(0,k+m)+p[1]+b.substring(k+m):p[0]===DIFF_DELETE&&(b=b.substring(0,k+m)+b.substring(k+this.diff_xIndex(g,h+p[1].length)));p[0]!==DIFF_DELETE&&(h+=p[1].length)}}}b=b.substring(c.length,b.length-c.length);return[b,e]};
diff_match_patch.prototype.patch_addPadding=function(a){for(var b=this.Patch_Margin,c="",d=1;d<=b;d++)c+=String.fromCharCode(d);for(d=0;d<a.length;d++)a[d].start1+=b,a[d].start2+=b;d=a[0];var e=d.diffs;if(0==e.length||e[0][0]!=DIFF_EQUAL)e.unshift(new diff_match_patch.Diff(DIFF_EQUAL,c)),d.start1-=b,d.start2-=b,d.length1+=b,d.length2+=b;else if(b>e[0][1].length){var f=b-e[0][1].length;e[0][1]=c.substring(e[0][1].length)+e[0][1];d.start1-=f;d.start2-=f;d.length1+=f;d.length2+=f}d=a[a.length-1];e=d.diffs;
0==e.length||e[e.length-1][0]!=DIFF_EQUAL?(e.push(new diff_match_patch.Diff(DIFF_EQUAL,c)),d.length1+=b,d.length2+=b):b>e[e.length-1][1].length&&(f=b-e[e.length-1][1].length,e[e.length-1][1]+=c.substring(0,f),d.length1+=f,d.length2+=f);return c};
diff_match_patch.prototype.patch_splitMax=function(a){for(var b=this.Match_MaxBits,c=0;c<a.length;c++)if(!(a[c].length1<=b)){var d=a[c];a.splice(c--,1);for(var e=d.start1,f=d.start2,g="";0!==d.diffs.length;){var h=new diff_match_patch.patch_obj,l=!0;h.start1=e-g.length;h.start2=f-g.length;""!==g&&(h.length1=h.length2=g.length,h.diffs.push(new diff_match_patch.Diff(DIFF_EQUAL,g)));for(;0!==d.diffs.length&&h.length1<b-this.Patch_Margin;){g=d.diffs[0][0];var k=d.diffs[0][1];g===DIFF_INSERT?(h.length2+=
k.length,f+=k.length,h.diffs.push(d.diffs.shift()),l=!1):g===DIFF_DELETE&&1==h.diffs.length&&h.diffs[0][0]==DIFF_EQUAL&&k.length>2*b?(h.length1+=k.length,e+=k.length,l=!1,h.diffs.push(new diff_match_patch.Diff(g,k)),d.diffs.shift()):(k=k.substring(0,b-h.length1-this.Patch_Margin),h.length1+=k.length,e+=k.length,g===DIFF_EQUAL?(h.length2+=k.length,f+=k.length):l=!1,h.diffs.push(new diff_match_patch.Diff(g,k)),k==d.diffs[0][1]?d.diffs.shift():d.diffs[0][1]=d.diffs[0][1].substring(k.length))}g=this.diff_text2(h.diffs);
g=g.substring(g.length-this.Patch_Margin);k=this.diff_text1(d.diffs).substring(0,this.Patch_Margin);""!==k&&(h.length1+=k.length,h.length2+=k.length,0!==h.diffs.length&&h.diffs[h.diffs.length-1][0]===DIFF_EQUAL?h.diffs[h.diffs.length-1][1]+=k:h.diffs.push(new diff_match_patch.Diff(DIFF_EQUAL,k)));l||a.splice(++c,0,h)}}};diff_match_patch.prototype.patch_toText=function(a){for(var b=[],c=0;c<a.length;c++)b[c]=a[c];return b.join("")};
diff_match_patch.prototype.patch_fromText=function(a){var b=[];if(!a)return b;a=a.split("\n");for(var c=0,d=/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;c<a.length;){var e=a[c].match(d);if(!e)throw Error("Invalid patch string: "+a[c]);var f=new diff_match_patch.patch_obj;b.push(f);f.start1=parseInt(e[1],10);""===e[2]?(f.start1--,f.length1=1):"0"==e[2]?f.length1=0:(f.start1--,f.length1=parseInt(e[2],10));f.start2=parseInt(e[3],10);""===e[4]?(f.start2--,f.length2=1):"0"==e[4]?f.length2=0:(f.start2--,f.length2=
parseInt(e[4],10));for(c++;c<a.length;){e=a[c].charAt(0);try{var g=decodeURI(a[c].substring(1))}catch(h){throw Error("Illegal escape in patch_fromText: "+g);}if("-"==e)f.diffs.push(new diff_match_patch.Diff(DIFF_DELETE,g));else if("+"==e)f.diffs.push(new diff_match_patch.Diff(DIFF_INSERT,g));else if(" "==e)f.diffs.push(new diff_match_patch.Diff(DIFF_EQUAL,g));else if("@"==e)break;else if(""!==e)throw Error('Invalid patch mode "'+e+'" in: '+g);c++}}return b};
diff_match_patch.patch_obj=function(){this.diffs=[];this.start2=this.start1=null;this.length2=this.length1=0};
diff_match_patch.patch_obj.prototype.toString=function(){for(var a=["@@ -"+(0===this.length1?this.start1+",0":1==this.length1?this.start1+1:this.start1+1+","+this.length1)+" +"+(0===this.length2?this.start2+",0":1==this.length2?this.start2+1:this.start2+1+","+this.length2)+" @@\n"],b,c=0;c<this.diffs.length;c++){switch(this.diffs[c][0]){case DIFF_INSERT:b="+";break;case DIFF_DELETE:b="-";break;case DIFF_EQUAL:b=" "}a[c+1]=b+encodeURI(this.diffs[c][1])+"\n"}return a.join("").replace(/%20/g," ")};
this.diff_match_patch=diff_match_patch;this.DIFF_DELETE=DIFF_DELETE;this.DIFF_INSERT=DIFF_INSERT;this.DIFF_EQUAL=DIFF_EQUAL;


function myFunction() {
  const dmp = new diff_match_patch()
  console.log(getFiles(10))
  console.log(searchFiles('Lucas Zhang - Sport marketing 3c'))
}

function doGet(e) {
  const wsUrl = (e && e.parameter && e.parameter.wsUrl) || 'ws://localhost:3000/ws'
  const token = (e && e.parameter && e.parameter.token) || 'dev-token'
  return HtmlService.createHtmlOutput(buildBridgeHtml_(wsUrl, token))
    .setTitle('Docs MCP Bridge')
}

function buildBridgeHtml_(wsUrl, token) {
  const safeWsUrl = JSON.stringify(String(wsUrl))
  const safeToken = JSON.stringify(String(token))
  return `<!doctype html>
<html>
  <body>
    <div>Docs MCP bridge connected.</div>
    <p id="log"></p>
    <script>
      (function () {
        const wsUrl = ${safeWsUrl}
        const token = ${safeToken}
        const logEl = document.getElementById('log')
        const ws = new WebSocket(wsUrl)

        function logLine(message) {
          const line = '[' + new Date().toISOString() + '] ' + String(message)
          if (logEl) {
            logEl.appendChild(document.createTextNode(line))
            logEl.appendChild(document.createElement('br'))
          }
          console.log(line)
        }

        function send(obj) {
          ws.send(JSON.stringify(obj))
        }

        function sendResult(id, result) {
          logLine('rpc_result sent: ' + id)
          send({ type: 'rpc_result', id, result })
        }

        function sendError(id, message) {
          logLine('rpc_error sent: ' + id + ' -> ' + String(message || 'Unknown error'))
          send({ type: 'rpc_result', id, error: String(message || 'Unknown error') })
        }

        ws.addEventListener('open', function () {
          logLine('websocket open: ' + wsUrl)
          send({ type: 'hello', role: 'apps-script-bridge', token })
          logLine('hello sent')
        })

        ws.addEventListener('close', function () {
          logLine('websocket closed')
        })

        ws.addEventListener('error', function (event) {
          logLine('websocket error: ' + (event && event.message ? event.message : 'unknown'))
        })

        ws.addEventListener('message', function (event) {
          logLine('message received')
          let msg
          try {
            msg = JSON.parse(event.data)
          } catch (err) {
            logLine('invalid JSON message')
            return
          }

          if (msg.type !== 'rpc_request' || !msg.id || !msg.method) return

          const id = msg.id
          const params = msg.params || {}
          logLine('rpc_request: ' + msg.method + ' (' + id + ')')

          if (msg.method === 'getfiles') {
            google.script.run
              .withSuccessHandler((result) => {
                logLine('getfiles success')
                sendResult(id, result)
              })
              .withFailureHandler((err) => {
                logLine('getfiles failure')
                sendError(id, err && err.message)
              })
              .mcp_getFiles(params.limit)
            return
          }

          if (msg.method === 'searchfiles') {
            google.script.run
              .withSuccessHandler((result) => {
                logLine('searchfiles success')
                sendResult(id, result)
              })
              .withFailureHandler((err) => {
                logLine('searchfiles failure')
                sendError(id, err && err.message)
              })
              .mcp_searchFiles(params.query, params.limit)
            return
          }

          if (msg.method === 'renamedoc') {
            google.script.run
              .withSuccessHandler((result) => {
                logLine('renamedoc success')
                sendResult(id, result)
              })
              .withFailureHandler((err) => {
                logLine('renamedoc failure')
                sendError(id, err && err.message)
              })
              .mcp_renameDoc(params.id, params.title)
            return
          }

          if (msg.method === 'renametab') {
            google.script.run
              .withSuccessHandler((result) => {
                logLine('renametab success')
                sendResult(id, result)
              })
              .withFailureHandler((err) => {
                logLine('renametab failure')
                sendError(id, err && err.message)
              })
              .mcp_renameTab(params.id, params.tabId, params.title)
            return
          }

          if (msg.method === 'newdoc') {
            google.script.run
              .withSuccessHandler((result) => {
                logLine('newdoc success')
                sendResult(id, result)
              })
              .withFailureHandler((err) => {
                logLine('newdoc failure')
                sendError(id, err && err.message)
              })
              .mcp_newDoc(params.title)
            return
          }

          if (msg.method === 'newtab') {
            google.script.run
              .withSuccessHandler((result) => {
                logLine('newtab success')
                sendResult(id, result)
              })
              .withFailureHandler((err) => {
                logLine('newtab failure')
                sendError(id, err && err.message)
              })
              .mcp_newTab(params.id, params.title, params.parentTabId)
            return
          }

          if (msg.method === 'getcontents') {
            google.script.run
              .withSuccessHandler((result) => {
                logLine('getcontents success')
                sendResult(id, result)
              })
              .withFailureHandler((err) => {
                logLine('getcontents failure')
                sendError(id, err && err.message)
              })
              .mcp_getContents(params.id, params.startLine, params.endLine, params.format, params.tabId)
            return
          }

          if (msg.method === 'applypatch') {
            google.script.run
              .withSuccessHandler((result) => {
                logLine('applypatch success')
                sendResult(id, result)
              })
              .withFailureHandler((err) => {
                logLine('applypatch failure')
                sendError(id, err && err.message)
              })
              .mcp_applyPatch(params.id, params.patch, params.algorithm, params.format, params.tabId)
            return
          }

          sendError(id, 'Unknown method: ' + msg.method)
        })
      })()
    </script>
  </body>
</html>`
}

function mcp_getFiles(limit) {
  return getFiles(limit)
}

function mcp_searchFiles(query, limit) {
  return searchFiles(query, limit)
}

function mcp_renameDoc(id, title) {
  return renameDoc(id, title)
}

function mcp_renameTab(id, tabId, title) {
  return renameTab(id, tabId, title)
}

function mcp_newDoc(title) {
  return newDoc(title)
}

function mcp_newTab(id, title, parentTabId) {
  return newTab(id, title, parentTabId)
}

function mcp_getContents(id, startLine, endLine, format, tabId) {
  return getContents(id, startLine, endLine, format, tabId)
}

function mcp_applyPatch(id, patchText, algorithm, format, tabId) {
  return applyPatchToDocument(id, patchText, algorithm, format, tabId)
}

function getContents(id, startLine, endLine, format, tabId) {
  const normalizedFormat = normalizeContentFormat_(format)
  const docInfo = getDocumentInfo_(id)
  const doc = docsApiGetDocument_(id, true)
  const tabContext = resolveDocTabContext_(doc, tabId)
  const availableTabs = listAvailableTabs_(doc)
  const text = markdownFromDocsApiDocument_(doc, tabContext)
  const lines = text.split('\n')
  const totalLines = lines.length

  const start = Math.max(1, Number(startLine) || 1)
  const end = Math.min(totalLines, Number(endLine) || totalLines)
  if (start > end) {
    return {
      id,
      title: docInfo.title,
      lastEditedMs: docInfo.lastEditedMs,
      lastEditedIso: docInfo.lastEditedIso,
      tabId: tabContext.tabId || null,
      tabName: tabContext.tabName || null,
      availableTabs,
      startLine: start,
      endLine: end,
      totalLines,
      hasMore: false,
      text: '',
    }
  }

  return {
    id,
    title: docInfo.title,
    lastEditedMs: docInfo.lastEditedMs,
    lastEditedIso: docInfo.lastEditedIso,
    tabId: tabContext.tabId || null,
    tabName: tabContext.tabName || null,
    availableTabs,
    format: normalizedFormat,
    startLine: start,
    endLine: end,
    totalLines,
    hasMore: end < totalLines,
    text: lines.slice(start - 1, end).join('\n'),
  }
}

function getDocumentInfo_(id) {
  const file = DriveApp.getFileById(id)
  const lastEdited = file.getLastUpdated()
  return {
    title: file.getName(),
    lastEditedMs: lastEdited.getTime(),
    lastEditedIso: lastEdited.toISOString(),
  }
}

function renameDoc(id, title) {
  const file = DriveApp.getFileById(id)
  const nextTitle = String(title || '').trim()
  if (!nextTitle) throw new Error('title is required')

  file.setName(nextTitle)
  const updated = file.getLastUpdated()
  return {
    id: file.getId(),
    title: file.getName(),
    url: file.getUrl(),
    lastEditedMs: updated.getTime(),
    lastEditedIso: updated.toISOString(),
  }
}

function renameTab(id, tabId, title) {
  const nextTitle = String(title || '').trim()
  const resolvedTabId = String(tabId || '').trim()
  if (!resolvedTabId) throw new Error('tabId is required')
  if (!nextTitle) throw new Error('title is required')

  docsApiBatchUpdate_(id, [
    {
      updateTabProperties: {
        tabProperties: {
          tabId: resolvedTabId,
          title: nextTitle,
        },
        fields: 'title',
      },
    },
  ])

  const doc = docsApiGetDocument_(id, true)
  const tabs = listAvailableTabs_(doc)
  const tab = tabs.find((t) => t.id === resolvedTabId) || null
  return {
    id,
    tabId: resolvedTabId,
    title: tab && tab.title ? tab.title : nextTitle,
    availableTabs: tabs,
  }
}

function newDoc(title) {
  const nextTitle = String(title || '').trim()
  if (!nextTitle) throw new Error('title is required')

  const doc = DocumentApp.create(nextTitle)
  const id = doc.getId()
  const file = DriveApp.getFileById(id)
  const updated = file.getLastUpdated()
  return {
    id,
    title: file.getName(),
    url: file.getUrl(),
    lastEditedMs: updated.getTime(),
    lastEditedIso: updated.toISOString(),
  }
}

function newTab(id, title, parentTabId) {
  const nextTitle = String(title || '').trim()
  if (!nextTitle) throw new Error('title is required')

  const tabProps = { title: nextTitle }
  const parentId = String(parentTabId || '').trim()
  if (parentId) tabProps.parentTabId = parentId

  docsApiBatchUpdate_(id, [{ addDocumentTab: { tabProperties: tabProps } }])

  const freshDoc = docsApiGetDocument_(id, true)
  const tabs = listAvailableTabs_(freshDoc)
  const created = tabs.filter((t) => t.title === nextTitle)
  const tab = created.length > 0 ? created[created.length - 1] : null
  return {
    id,
    tabId: tab && tab.id ? tab.id : null,
    title: tab && tab.title ? tab.title : nextTitle,
    availableTabs: tabs,
  }
}

function listAvailableTabs_(doc) {
  const out = []
  const tabs = (doc && doc.tabs) || []

  function walk(tabList, parentTabId) {
    for (let i = 0; i < tabList.length; i++) {
      const tab = tabList[i]
      if (!tab) continue
      const props = tab.tabProperties || {}
      const id = String(props.tabId || tab.tabId || '')
      const title = String(props.title || tab.title || '')
      const index = Number(props.index)

      out.push({
        id: id || null,
        title: title || null,
        index: Number.isFinite(index) ? index : out.length,
        parentTabId: parentTabId || null,
      })

      const children = tab.childTabs || []
      if (children.length > 0) walk(children, id || null)
    }
  }

  walk(tabs, null)
  return out
}

function resolveDocTabContext_(doc, requestedTabId) {
  const selectedTabId = String(requestedTabId || '').trim()
  const bodyContent = (doc && doc.body && doc.body.content) || []
  const listsById = (doc && doc.lists) || {}

  if (!selectedTabId) {
    return {
      tabId: null,
      tabName: null,
      content: bodyContent,
      listsById,
      requestTabId: null,
    }
  }

  const match = findTabById_((doc && doc.tabs) || [], selectedTabId)
  if (!match) {
    throw new Error('tabId not found: ' + selectedTabId)
  }

  const tab = match.tab
  const props = (tab && tab.tabProperties) || {}
  const docTab = (tab && tab.documentTab) || {}
  return {
    tabId: String(props.tabId || selectedTabId),
    tabName: String(props.title || tab.title || ''),
    content: (docTab && docTab.body && docTab.body.content) || [],
    listsById: (docTab && docTab.lists) || listsById,
    requestTabId: String(props.tabId || selectedTabId),
  }
}

function findTabById_(tabs, tabId) {
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i]
    if (!tab) continue
    const props = tab.tabProperties || {}
    const id = String(props.tabId || tab.tabId || '')
    if (id === tabId) return { tab }
    const children = tab.childTabs || []
    const nested = findTabById_(children, tabId)
    if (nested) return nested
  }
  return null
}

function applyPatchToDocument(id, patchText, algorithm, format, tabId) {
  const dmp = new diff_match_patch()
  const mode = (algorithm || 'unified').toLowerCase()
  const normalizedFormat = normalizeContentFormat_(format)
  const debugBase = {
    documentId: id,
    algorithm: mode === 'unified' ? 'unified' : 'dmp',
    format: normalizedFormat,
    tabId: tabId || null,
    patchText,
  }

  try {
    const doc = docsApiGetDocument_(id, true)
    const tabContext = resolveDocTabContext_(doc, tabId)
    const exported = markdownFromDocsApiDocumentWithLineMap_(doc, tabContext)
    const markdown = exported.text
    let text2
    let patchesOrHunks
    let results
    let dmpResults

    if (mode === 'unified') {
      const hunks = parseUnifiedHunks_(patchText)
      const unifiedResult = applyUnifiedHunksToText_(markdown, hunks)
      const dmpApplied = applyTextTransitionWithDmpString_(markdown, unifiedResult[0], dmp)
      text2 = dmpApplied.text
      results = unifiedResult[1]
      dmpResults = dmpApplied.results
      patchesOrHunks = hunks
    } else {
      const dmpResult = applyPatchToText_(markdown, patchText, dmp)
      text2 = dmpResult[0]
      patchesOrHunks = dmpResult[1]
      results = dmpResult[2]
      dmpResults = dmpResult[2]
    }

    const appliedIncrementally = applyMarkdownDiffIncremental_(id, exported, text2, tabContext)
    if (!appliedIncrementally) {
      importMarkdownIntoExistingDocument_(id, text2, tabContext)
    }

    return {
      algorithm: mode === 'unified' ? 'unified' : 'dmp',
      format: normalizedFormat,
      tabId: tabContext.tabId || null,
      tabName: tabContext.tabName || null,
      appliedIncrementally,
      patches: patchesOrHunks.length,
      results,
      dmpResults,
      textLength: text2.length,
    }
  } catch (err) {
    throw createApplyPatchDebugError_(err, debugBase)
  }
}

function createApplyPatchDebugError_(err, debugData) {
  const message = String((err && err.message) || err || 'Unknown applypatch error')
  const payload = {
    error: message,
    patchDebug: debugData || {},
  }
  return new Error('applypatch failed: ' + JSON.stringify(payload))
}

function normalizeContentFormat_(format) {
  const value = String(format || 'markdown').toLowerCase()
  if (value && value !== 'markdown') {
    throw new Error('Only markdown format is supported. Omit `format` or use `markdown`.')
  }
  return 'markdown'
}

function exportDocumentAsMarkdown_(documentId, tabId) {
  const doc = docsApiGetDocument_(documentId, true)
  const tabContext = resolveDocTabContext_(doc, tabId)
  return markdownFromDocsApiDocument_(doc, tabContext)
}

function importMarkdownIntoExistingDocument_(targetDocumentId, markdownText, tabContext) {
  importMarkdownIntoExistingDocumentWithDocsApi_(targetDocumentId, markdownText, tabContext)
}

function markdownFromDocsApiDocument_(doc, tabContext) {
  return markdownFromDocsApiDocumentWithLineMap_(doc, tabContext).text
}

function markdownFromDocsApiDocumentWithLineMap_(doc, tabContext) {
  const context = tabContext || resolveDocTabContext_(doc)
  const content = context.content || []
  const listsById = context.listsById || {}
  const listState = { counters: {} }
  const lines = []
  const lineMap = []
  let hasTables = false

  for (let i = 0; i < content.length; i++) {
    const block = content[i]
    if (!block) continue

    if (block.paragraph) {
      lines.push(markdownLineFromParagraph_(block.paragraph, listsById, listState))
      lineMap.push({
        type: 'paragraph',
        startIndex: Number(block.startIndex) || null,
        endIndex: Number(block.endIndex) || null,
      })
      continue
    }

    if (block.table) {
      hasTables = true
      const tableLines = markdownLinesFromTable_(block.table)
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('')
        lineMap.push({ type: 'table-gap', startIndex: null, endIndex: null })
      }
      for (let t = 0; t < tableLines.length; t++) {
        lines.push(tableLines[t])
        lineMap.push({ type: 'table', startIndex: null, endIndex: null })
      }
      if (i < content.length - 1) {
        lines.push('')
        lineMap.push({ type: 'table-gap', startIndex: null, endIndex: null })
      }
    }
  }

  // Collapse consecutive blank lines into at most one, and remove trailing blanks.
  const collapsedLines = []
  const collapsedLineMap = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '' && collapsedLines.length > 0 && collapsedLines[collapsedLines.length - 1] === '') continue
    collapsedLines.push(lines[i])
    collapsedLineMap.push(lineMap[i])
  }
  while (collapsedLines.length > 0 && collapsedLines[collapsedLines.length - 1] === '') {
    collapsedLines.pop()
    collapsedLineMap.pop()
  }

  return {
    text: collapsedLines.join('\n'),
    lines: collapsedLines,
    lineMap: collapsedLineMap,
    hasTables,
  }
}

function applyMarkdownDiffIncremental_(documentId, exported, nextMarkdown, tabContext) {
  const oldLines = (exported && exported.lines) || []
  const oldMap = (exported && exported.lineMap) || []
  const newLines = String(nextMarkdown || '').split('\n')
  const context = tabContext || { requestTabId: null }

  if (exported && exported.hasTables) return false
  if (containsMarkdownTableSyntax_(nextMarkdown)) return false

  let prefix = 0
  while (
    prefix < oldLines.length &&
    prefix < newLines.length &&
    oldLines[prefix] === newLines[prefix]
  ) {
    prefix++
  }

  let suffix = 0
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) {
    suffix++
  }

  const oldStart = prefix
  const oldEnd = oldLines.length - suffix - 1
  const newStart = prefix
  const newEnd = newLines.length - suffix - 1

  if (oldStart > oldEnd && newStart > newEnd) return true

  let insertAt = null
  let deleteStart = null
  let deleteEnd = null

  if (oldStart <= oldEnd) {
    const first = oldMap[oldStart]
    const last = oldMap[oldEnd]
    if (!first || !last) return false
    if (!(first.startIndex > 0) || !(last.endIndex > first.startIndex)) return false
    insertAt = first.startIndex
    deleteStart = first.startIndex
    deleteEnd = last.endIndex
  } else if (oldMap.length > 0) {
    if (oldStart < oldMap.length) {
      const at = oldMap[oldStart]
      if (!at || !(at.startIndex > 0)) return false
      insertAt = at.startIndex
    } else {
      const tail = oldMap[oldMap.length - 1]
      if (!tail || !(tail.endIndex > 0)) return false
      insertAt = tail.endIndex
    }
  } else {
    insertAt = 1
  }

  if (!(insertAt > 0)) return false

  const replacementLines = newStart <= newEnd ? newLines.slice(newStart, newEnd + 1) : []
  const replacementMarkdown = replacementLines.join('\n')
  const parsed = parseMarkdownDocumentForDocsApi_(replacementMarkdown)

  const requests = []

  if (deleteStart !== null && deleteEnd !== null && deleteEnd > deleteStart) {
    const range = { startIndex: deleteStart, endIndex: deleteEnd }
    if (context.requestTabId) range.tabId = context.requestTabId
    requests.push({ deleteContentRange: { range } })
  }

  if (parsed.text.length > 0) {
    const location = { index: insertAt }
    if (context.requestTabId) location.tabId = context.requestTabId
    requests.push({
      insertText: {
        location,
        text: parsed.text,
      },
    })

    for (let i = 0; i < parsed.lines.length; i++) {
      const line = parsed.lines[i]
      const paragraphStart = insertAt + line.start
      const paragraphEnd = paragraphStart + line.text.length + 1

      if (line.headingLevel > 0) {
        const range = { startIndex: paragraphStart, endIndex: paragraphEnd }
        if (context.requestTabId) range.tabId = context.requestTabId
        requests.push({
          updateParagraphStyle: {
            range,
            paragraphStyle: {
              namedStyleType: namedStyleTypeFromHeadingLevel_(line.headingLevel),
            },
            fields: 'namedStyleType',
          },
        })
      }

      if (line.isList && line.text.length > 0) {
        const range = { startIndex: paragraphStart, endIndex: paragraphEnd }
        if (context.requestTabId) range.tabId = context.requestTabId
        requests.push({
          createParagraphBullets: {
            range,
            bulletPreset: line.listType === 'ordered' ? 'NUMBERED_DECIMAL_NESTED' : 'BULLET_DISC_CIRCLE_SQUARE',
          },
        })
      }

      for (let j = 0; j < line.styles.length; j++) {
        const span = line.styles[j]
        const startIndex = paragraphStart + span.start
        const endIndex = startIndex + span.length
        if (endIndex <= startIndex) continue

        const style = {}
        const fields = []
        if (span.bold) {
          style.bold = true
          fields.push('bold')
        }
        if (span.italic) {
          style.italic = true
          fields.push('italic')
        }
        if (span.underline) {
          style.underline = true
          fields.push('underline')
        }
        if (span.foregroundColor) {
          const rgb = hexToRgbColor_(span.foregroundColor)
          if (rgb) {
            style.foregroundColor = { color: { rgbColor: rgb } }
            fields.push('foregroundColor')
          }
        }
        if (span.backgroundColor) {
          const bgRgb = hexToRgbColor_(span.backgroundColor)
          if (bgRgb) {
            style.backgroundColor = { color: { rgbColor: bgRgb } }
            fields.push('backgroundColor')
          }
        }
        if (span.fontSize) {
          style.fontSize = { magnitude: Number(span.fontSize), unit: 'PT' }
          fields.push('fontSize')
        }
        if (fields.length === 0) continue

        const range = { startIndex, endIndex }
        if (context.requestTabId) range.tabId = context.requestTabId
        requests.push({
          updateTextStyle: {
            range,
            textStyle: style,
            fields: fields.join(','),
          },
        })
      }
    }
  }

  if (requests.length === 0) return true

  try {
    docsApiBatchUpdate_(documentId, requests)
  } catch (err) {
    throw createApplyPatchDebugError_(err, {
      phase: 'incremental-batch-update',
      documentId,
      tabId: context.requestTabId || null,
      oldStart,
      oldEnd,
      newStart,
      newEnd,
      insertAt,
      deleteStart,
      deleteEnd,
      replacementMarkdown,
      requestCount: requests.length,
      failedRequest: extractFailedRequestContext_((err && err.message) || '', requests),
    })
  }

  return true
}

function extractFailedRequestContext_(message, requests) {
  const m = /requests\[(\d+)\]/.exec(String(message || ''))
  if (!m) {
    return {
      index: null,
      context: requests.slice(0, Math.min(5, requests.length)),
    }
  }

  const index = Number(m[1])
  const start = Math.max(0, index - 2)
  const end = Math.min(requests.length, index + 3)
  return {
    index,
    context: requests.slice(start, end),
  }
}

function markdownLinesFromTable_(table) {
  const rows = (table && table.tableRows) || []
  if (rows.length === 0) return []

  const parsedRows = []
  let maxCols = 0

  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].tableCells || []
    const parsedRow = []
    for (let c = 0; c < cells.length; c++) {
      parsedRow.push(markdownTextFromTableCell_(cells[c]))
      const colSpan = (cells[c].tableCellStyle && cells[c].tableCellStyle.columnSpan) || 1
      for (let s = 1; s < colSpan; s++) parsedRow.push('')
    }
    if (parsedRow.length > maxCols) maxCols = parsedRow.length
    parsedRows.push(parsedRow)
  }

  if (maxCols === 0) return []

  for (let r = 0; r < parsedRows.length; r++) {
    while (parsedRows[r].length < maxCols) parsedRows[r].push('')
  }

  const lines = []
  lines.push('| ' + parsedRows[0].join(' | ') + ' |')
  lines.push('| ' + Array(maxCols).fill(':----').join(' | ') + ' |')

  for (let r = 1; r < parsedRows.length; r++) {
    lines.push('| ' + parsedRows[r].join(' | ') + ' |')
  }

  return lines
}

function markdownTextFromTableCell_(cell) {
  const content = (cell && cell.content) || []
  const segments = []

  for (let i = 0; i < content.length; i++) {
    const block = content[i]
    if (!block || !block.paragraph) continue
    segments.push(markdownTextFromParagraphElements_(block.paragraph.elements || []))
  }

  while (segments.length > 0 && segments[segments.length - 1] === '') segments.pop()
  let text = segments.join('<br>').replace(/\|/g, '\\|')
  const bg = getTableCellBackgroundColor_(cell)
  if (bg) text = '{cellbg:' + bg + '}' + text
  return text
}

function markdownLineFromParagraph_(paragraph, listsById, listState) {
  const paragraphText = markdownTextFromParagraphElements_(paragraph.elements || [])
  const headingPrefix = markdownHeadingPrefixFromParagraph_(paragraph)
  const listPrefix = markdownListPrefixFromParagraph_(paragraph, listsById, listState)
  return headingPrefix + listPrefix + paragraphText
}

function markdownHeadingPrefixFromParagraph_(paragraph) {
  const style = paragraph && paragraph.paragraphStyle
  const level = headingLevelFromNamedStyleType_(style && style.namedStyleType)
  if (!level) return ''
  return '#'.repeat(level) + ' '
}

function headingLevelFromNamedStyleType_(namedStyleType) {
  const type = String(namedStyleType || '')
  if (type === 'TITLE') return 1
  if (type === 'SUBTITLE') return 2

  const m = /^HEADING_(\d)$/.exec(type)
  if (!m) return 0
  return Math.max(1, Math.min(4, Number(m[1]) || 1))
}

function namedStyleTypeFromHeadingLevel_(headingLevel) {
  const level = Math.max(1, Math.min(4, Number(headingLevel) || 1))
  return 'HEADING_' + level
}

function markdownListPrefixFromParagraph_(paragraph, listsById, listState) {
  if (!paragraph || !paragraph.bullet) return ''

  const listId = paragraph.bullet.listId || 'default'
  const level = Math.max(0, Number(paragraph.bullet.nestingLevel) || 0)
  const indent = '\t'.repeat(level)
  const ordered = isOrderedListParagraph_(paragraph, listsById)

  if (!ordered) return indent + '* '

  const key = listId + ':' + level
  const current = Number(listState && listState.counters && listState.counters[key]) || 0
  const next = current + 1
  if (listState && listState.counters) listState.counters[key] = next
  return indent + next + '. '
}

function isOrderedListParagraph_(paragraph, listsById) {
  if (!paragraph || !paragraph.bullet) return false

  const listId = paragraph.bullet.listId
  const level = Math.max(0, Number(paragraph.bullet.nestingLevel) || 0)
  const list = listId && listsById && listsById[listId]
  const nesting =
    list &&
    list.listProperties &&
    list.listProperties.nestingLevels &&
    list.listProperties.nestingLevels[level]
  const glyphType = String(nesting && nesting.glyphType ? nesting.glyphType : '')

  return /DECIMAL|ALPHA|ROMAN|NUMBER/i.test(glyphType)
}

function markdownTextFromParagraphElements_(elements) {
  let out = ''
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    if (!el || !el.textRun) continue
    const run = el.textRun
    const raw = String(run.content || '').replace(/\n/g, '')
    const escaped = escapeMarkdownLiteralText_(raw)
    out += applyMarkdownInlineStyle_(escaped, run.textStyle || {})
  }
  return out
}

function escapeMarkdownLiteralText_(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
}

function applyMarkdownInlineStyle_(text, style) {
  const hasBold = !!(style && style.bold)
  const hasItalic = !!(style && style.italic)
  const hasUnderline = !!(style && style.underline)
  const color = getHexColorFromTextStyle_(style)
  const size = getFontSizeFromTextStyle_(style)
  const highlight = getHighlightColorFromTextStyle_(style)

  let out = text
  if (hasBold && hasItalic) out = '***' + out + '***'
  else if (hasBold) out = '**' + out + '**'
  else if (hasItalic) out = '*' + out + '*'
  if (hasUnderline) out = '{u}' + out + '{/u}'

  if (size) out = '{size:' + size + '}' + out + '{/size}'
  if (color) out = '{color:' + color + '}' + out + '{/color}'
  if (highlight) out = '{highlight:' + highlight + '}' + out + '{/highlight}'
  return out
}

function getHexColorFromTextStyle_(style) {
  const foreground = style && style.foregroundColor
  const rgb =
    (foreground && foreground.color && foreground.color.rgbColor) ||
    (foreground && foreground.opaqueColor && foreground.opaqueColor.rgbColor) ||
    (foreground && foreground.rgbColor)
  if (!rgb) return null

  function toHexChannel_(n) {
    const v = Math.max(0, Math.min(255, Math.round((Number(n) || 0) * 255)))
    const h = v.toString(16)
    return h.length === 1 ? '0' + h : h
  }

  return (
    '#' +
    toHexChannel_(rgb.red) +
    toHexChannel_(rgb.green) +
    toHexChannel_(rgb.blue)
  )
}

function getFontSizeFromTextStyle_(style) {
  const fs = style && style.fontSize
  if (!fs) return null

  if (typeof fs === 'number') {
    if (fs <= 0) return null
    return Math.round(fs)
  }

  const magnitude = Number(fs.magnitude)
  if (!(magnitude > 0)) return null
  return Math.round(magnitude)
}

function getHighlightColorFromTextStyle_(style) {
  const bg = style && style.backgroundColor
  const rgb =
    (bg && bg.color && bg.color.rgbColor) ||
    (bg && bg.opaqueColor && bg.opaqueColor.rgbColor) ||
    (bg && bg.rgbColor)
  if (!rgb) return null

  function toHexChannel_(n) {
    const v = Math.max(0, Math.min(255, Math.round((Number(n) || 0) * 255)))
    const h = v.toString(16)
    return h.length === 1 ? '0' + h : h
  }

  const hex =
    '#' +
    toHexChannel_(rgb.red) +
    toHexChannel_(rgb.green) +
    toHexChannel_(rgb.blue)
  return hex === '#ffffff' ? null : hex
}

function getTableCellBackgroundColor_(cell) {
  const style = cell && cell.tableCellStyle
  const bg = style && style.backgroundColor
  const rgb =
    (bg && bg.color && bg.color.rgbColor) ||
    (bg && bg.opaqueColor && bg.opaqueColor.rgbColor) ||
    (bg && bg.rgbColor)
  if (!rgb) return null

  function toHexChannel_(n) {
    const v = Math.max(0, Math.min(255, Math.round((Number(n) || 0) * 255)))
    const h = v.toString(16)
    return h.length === 1 ? '0' + h : h
  }

  const hex =
    '#' +
    toHexChannel_(rgb.red) +
    toHexChannel_(rgb.green) +
    toHexChannel_(rgb.blue)
  return hex === '#ffffff' ? null : hex
}

function importMarkdownIntoExistingDocumentWithDocsApi_(targetDocumentId, markdownText, tabContext) {
  if (containsMarkdownTableSyntax_(markdownText)) {
    importMarkdownIntoExistingDocumentWithDocumentApp_(targetDocumentId, markdownText, tabContext)
    return
  }

  const context =
    tabContext || resolveDocTabContext_(docsApiGetDocument_(targetDocumentId, true))
  const parsed = parseMarkdownDocumentForDocsApi_(String(markdownText || ''))
  clearDocumentViaDocsApi_(targetDocumentId, context)

  if (parsed.text.length > 0) {
    const location = { index: 1 }
    if (context.requestTabId) location.tabId = context.requestTabId
    docsApiBatchUpdate_(targetDocumentId, [
      {
        insertText: {
          location,
          text: parsed.text,
        },
      },
    ])
  }

  const requests = []

  for (let i = 0; i < parsed.lines.length; i++) {
    const line = parsed.lines[i]
    const paragraphStart = line.start + 1
    const paragraphEnd = paragraphStart + line.text.length + 1

    if (line.headingLevel > 0) {
      const range = { startIndex: paragraphStart, endIndex: paragraphEnd }
      if (context.requestTabId) range.tabId = context.requestTabId
      requests.push({
        updateParagraphStyle: {
          range,
          paragraphStyle: {
            namedStyleType: namedStyleTypeFromHeadingLevel_(line.headingLevel),
          },
          fields: 'namedStyleType',
        },
      })
    }

    if (line.isList && line.text.length > 0) {
      const range = { startIndex: paragraphStart, endIndex: paragraphEnd }
      if (context.requestTabId) range.tabId = context.requestTabId
      requests.push({
        createParagraphBullets: {
          range,
          bulletPreset: line.listType === 'ordered' ? 'NUMBERED_DECIMAL_NESTED' : 'BULLET_DISC_CIRCLE_SQUARE',
        },
      })
    }

    for (let j = 0; j < line.styles.length; j++) {
      const span = line.styles[j]
      const startIndex = paragraphStart + span.start
      const endIndex = startIndex + span.length
      if (endIndex <= startIndex) continue

      const style = {}
      const fields = []
      if (span.bold) {
        style.bold = true
        fields.push('bold')
      }
      if (span.italic) {
        style.italic = true
        fields.push('italic')
      }
      if (span.underline) {
        style.underline = true
        fields.push('underline')
      }
      if (span.foregroundColor) {
        const rgb = hexToRgbColor_(span.foregroundColor)
        if (rgb) {
          style.foregroundColor = { color: { rgbColor: rgb } }
          fields.push('foregroundColor')
        }
      }
      if (span.backgroundColor) {
        const bgRgb = hexToRgbColor_(span.backgroundColor)
        if (bgRgb) {
          style.backgroundColor = { color: { rgbColor: bgRgb } }
          fields.push('backgroundColor')
        }
      }
      if (span.fontSize) {
        style.fontSize = { magnitude: Number(span.fontSize), unit: 'PT' }
        fields.push('fontSize')
      }
      if (fields.length === 0) continue

      const range = { startIndex, endIndex }
      if (context.requestTabId) range.tabId = context.requestTabId

      requests.push({
        updateTextStyle: {
          range,
          textStyle: style,
          fields: fields.join(','),
        },
      })
    }
  }

  if (requests.length > 0) {
    docsApiBatchUpdate_(targetDocumentId, requests)
  }
}

function importMarkdownIntoExistingDocumentWithDocumentApp_(targetDocumentId, markdownText, tabContext) {
  const doc = DocumentApp.openById(targetDocumentId)
  let body
  if (tabContext && tabContext.requestTabId) {
    const tab = findDocumentAppTab_(doc.getTabs(), tabContext.requestTabId)
    if (!tab) throw new Error('Tab not found in DocumentApp: ' + tabContext.requestTabId)
    body = tab.asDocumentTab().getBody()
  } else {
    body = doc.getBody()
  }
  body.clear()

  const blocks = parseMarkdownBlocksForDocumentApp_(String(markdownText || ''))
  // listMeta tracks each list item's type and the exact text appended (tabs + content).
  // Text-based matching in fixDocumentAppListPresets_ is robust against content offset
  // uncertainties that come from body.clear() trailing paragraphs and table elements.
  const listMeta = []
  // tableMeta tracks tables with merged cells that need post-processing via Docs API.
  const tableMeta = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    if (block.type === 'table') {
      const table = body.appendTable(block.rows.map((row) => row.map((cell) => cell.text)))
      for (let r = 0; r < block.rows.length; r++) {
        for (let c = 0; c < block.rows[r].length; c++) {
          const cellSpec = block.rows[r][c]
          const tableCell = table.getCell(r, c)
          applyInlineStylesToTextElement_(tableCell.editAsText(), cellSpec.styles)
          if (cellSpec.backgroundColor) tableCell.setBackgroundColor(cellSpec.backgroundColor)
        }
      }
      if (block.merges && block.merges.length > 0) {
        tableMeta.push({ tableOrder: tableMeta.length, merges: block.merges })
      }
      continue
    }

    const line = parseMarkdownLineForDocsApi_(block.text)
    if (line.isList) {
      // Use appendParagraph (NOT appendListItem) so the paragraph has no bullet yet.
      // createParagraphBullets only infers nesting from leading tabs and applies the
      // correct preset on plain paragraphs; it cannot re-nest existing list items.
      const nestingTabs = '\t'.repeat(line.nestingLevel || 0)
      const fullText = nestingTabs + line.text
      const element = body.appendParagraph(fullText)
      applyInlineStylesToTextElement_(element.editAsText(), shiftStyles_(line.styles, line.nestingLevel || 0))
      listMeta.push({ listType: line.listType, hasText: line.text.length > 0, fullText })
    } else {
      const element = body.appendParagraph(line.text)
      if (line.headingLevel > 0) {
        const headingKey = 'HEADING' + line.headingLevel
        if (DocumentApp.ParagraphHeading[headingKey]) {
          element.setHeading(DocumentApp.ParagraphHeading[headingKey])
        }
      }
      applyInlineStylesToTextElement_(element.editAsText(), line.styles)
    }
  }

  // IMPORTANT: saveAndClose() before switching to the Docs REST API.
  // Apps Script warns that mixing DocumentApp and Docs API on the same document
  // causes race conditions — DocumentApp holds a write session that conflicts with
  // REST API changes.  saveAndClose() commits all pending DocumentApp writes so the
  // subsequent Docs API reads and createParagraphBullets requests see correct indices.
  doc.saveAndClose()

  // Apply merged cells via Docs API before list presets (merges alter table structure).
  if (tableMeta.length > 0) {
    fixDocumentAppTableMerges_(targetDocumentId, tableMeta, tabContext)
  }

  // Apply correct bullet presets and nesting via Docs API.
  // DocumentApp's setGlyphType is unreliable for nested ordered items; the Docs API
  // createParagraphBullets preset is the authoritative way to configure list glyphs.
  if (listMeta.length > 0) {
    fixDocumentAppListPresets_(targetDocumentId, listMeta, tabContext)
  }
}

function findDocumentAppTab_(tabs, targetId) {
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].getId() === targetId) return tabs[i]
    const nested = findDocumentAppTab_(tabs[i].getChildTabs(), targetId)
    if (nested) return nested
  }
  return null
}

function fixDocumentAppTableMerges_(documentId, tableMeta, tabContext) {
  const tabId = tabContext && tabContext.requestTabId ? tabContext.requestTabId : null
  const doc = docsApiGetDocument_(documentId, true)
  const resolvedContext = resolveDocTabContext_(doc, tabId)
  const content = resolvedContext.content || []

  // Collect table start indices in document order.
  const tableStartIndices = []
  for (let i = 0; i < content.length; i++) {
    if (content[i] && content[i].table) {
      tableStartIndices.push(content[i].startIndex)
    }
  }

  const requests = []
  for (let t = 0; t < tableMeta.length; t++) {
    const meta = tableMeta[t]
    const tableIdx = tableStartIndices[meta.tableOrder]
    if (tableIdx == null) continue
    for (let m = 0; m < meta.merges.length; m++) {
      const merge = meta.merges[m]
      const tableCellLocation = {
        tableStartLocation: { index: tableIdx },
        rowIndex: merge.rowIndex,
        columnIndex: merge.colIndex,
      }
      if (tabId) tableCellLocation.tableStartLocation.tabId = tabId
      requests.push({
        mergeTableCells: {
          tableRange: {
            tableCellLocation,
            rowSpan: merge.rowSpan,
            columnSpan: merge.colSpan,
          },
        },
      })
    }
  }

  if (requests.length > 0) {
    docsApiBatchUpdate_(documentId, requests)
  }
}

function fixDocumentAppListPresets_(documentId, listMeta, tabContext) {
  // Re-read via Docs API and match each list item to its paragraph by text content.
  // Text matching avoids fragile index arithmetic (body.clear() trailing paragraphs,
  // table elements, etc. make absolute content[] offsets unreliable).
  const tabId = tabContext && tabContext.requestTabId ? tabContext.requestTabId : null
  const doc = docsApiGetDocument_(documentId, true)
  const resolvedContext = resolveDocTabContext_(doc, tabId)
  const content = resolvedContext.content || []

  // Collect plain (non-bullet) paragraphs with their text and doc indices.
  const plainParas = []
  for (let i = 0; i < content.length; i++) {
    const el = content[i]
    if (el && el.paragraph && !el.paragraph.bullet) {
      const text = getDocsParagraphText_(el.paragraph)
      plainParas.push({ text, start: el.startIndex, end: el.endIndex, used: false })
    }
  }

  // Match each list item to the next unused paragraph whose text equals fullText.
  // Build a flat matched[] array (null for unmatched/empty items) in insertion order.
  const matched = []
  for (let i = 0; i < listMeta.length; i++) {
    const meta = listMeta[i]
    if (!meta.hasText) { matched.push(null); continue }

    let found = null
    for (let j = 0; j < plainParas.length; j++) {
      if (!plainParas[j].used && plainParas[j].text === meta.fullText) {
        found = plainParas[j]
        plainParas[j].used = true
        break
      }
    }
    matched.push(found ? { listType: meta.listType, start: found.start, end: found.end } : null)
  }

  // Group consecutive matched items of the same listType that are adjacent in the
  // document (endIndex of one paragraph === startIndex of the next). A single
  // createParagraphBullets call covering the whole group lets the Docs API infer
  // nesting level from leading tab characters — calling it per-paragraph would give
  // each item its own list with no nesting context.
  const groups = []
  let i = 0
  while (i < matched.length) {
    if (!matched[i]) { i++; continue }
    const group = [matched[i]]
    while (
      i + 1 < matched.length &&
      matched[i + 1] &&
      matched[i + 1].listType === group[0].listType &&
      matched[i + 1].start === group[group.length - 1].end
    ) {
      i++
      group.push(matched[i])
    }
    groups.push(group)
    i++
  }

  // One createParagraphBullets request per group spanning its full range.
  const requests = []
  for (let g = 0; g < groups.length; g++) {
    const group = groups[g]
    const start = group[0].start
    const end = group[group.length - 1].end
    if (!(end > start)) continue
    const range = { startIndex: start, endIndex: end }
    if (tabId) range.tabId = tabId
    requests.push({
      createParagraphBullets: {
        range,
        bulletPreset: group[0].listType === 'ordered' ? 'NUMBERED_DECIMAL_NESTED' : 'BULLET_DISC_CIRCLE_SQUARE',
      },
    })
  }

  if (requests.length === 0) return

  // Apply in reverse document order so index shifts from tab removal don't
  // invalidate the start/end indices of earlier (lower-index) groups.
  requests.sort(function(a, b) {
    return (b.createParagraphBullets.range.startIndex || 0) - (a.createParagraphBullets.range.startIndex || 0)
  })

  docsApiBatchUpdate_(documentId, requests)
}

function getDocsParagraphText_(paragraph) {
  const elements = (paragraph && paragraph.elements) || []
  return elements
    .map(function(e) { return (e.textRun && e.textRun.content) || '' })
    .join('')
    .replace(/\n$/, '')
}

function parseMarkdownBlocksForDocumentApp_(markdownText) {
  const lines = String(markdownText || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (isMarkdownTableRowLine_(line) && i + 1 < lines.length && isMarkdownTableSeparatorLine_(lines[i + 1])) {
      const tableLines = [line]
      i += 2

      while (i < lines.length && isMarkdownTableRowLine_(lines[i])) {
        tableLines.push(lines[i])
        i++
      }

      const rows = parseMarkdownTableRows_(tableLines)
      if (rows.length > 0) {
        const merges = computeTableMerges_(rows)
        blocks.push({ type: 'table', rows, merges })
      }
      continue
    }

    blocks.push({ type: 'paragraph', text: line })
    i++
  }

  return blocks
}

function computeTableMerges_(rows) {
  const merges = []
  for (let r = 0; r < rows.length; r++) {
    let c = 0
    while (c < rows[r].length) {
      const cell = rows[r][c]
      if (cell.text || cell.backgroundColor) {
        let span = 1
        while (
          c + span < rows[r].length &&
          !rows[r][c + span].text &&
          !rows[r][c + span].backgroundColor
        ) {
          span++
        }
        if (span > 1) {
          merges.push({ rowIndex: r, colIndex: c, rowSpan: 1, colSpan: span })
        }
        c += span
      } else {
        c++
      }
    }
  }
  return merges
}

function isMarkdownTableRowLine_(line) {
  return /^\s*\|.*\|\s*$/.test(String(line || ''))
}

function isMarkdownTableSeparatorLine_(line) {
  return /^\s*\|\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|\s*$/.test(String(line || ''))
}

function parseMarkdownTableRows_(tableLines) {
  const rows = []
  let maxCols = 0

  for (let i = 0; i < tableLines.length; i++) {
    const cellsRaw = splitMarkdownTableRowCells_(tableLines[i])
    const cells = []
    for (let c = 0; c < cellsRaw.length; c++) {
      const rawCell = cellsRaw[c].replace(/<br\s*\/?\s*>/gi, '\n')
      const bgMatch = /^\{cellbg:(#[0-9a-fA-F]{6})\}/.exec(rawCell)
      const backgroundColor = bgMatch ? bgMatch[1].toLowerCase() : null
      const cellContent = bgMatch ? rawCell.substring(bgMatch[0].length) : rawCell
      const inline = parseInlineMarkdownForDocsApi_(cellContent)
      cells.push({ text: inline.text, styles: inline.styles, backgroundColor })
    }
    if (cells.length > maxCols) maxCols = cells.length
    rows.push(cells)
  }

  for (let r = 0; r < rows.length; r++) {
    while (rows[r].length < maxCols) {
      rows[r].push({ text: '', styles: [], backgroundColor: null })
    }
  }

  return rows
}

function splitMarkdownTableRowCells_(line) {
  const raw = String(line || '').trim().replace(/^\|/, '').replace(/\|$/, '')
  const parts = []
  let cur = ''
  let escaping = false

  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charAt(i)
    if (escaping) {
      cur += ch
      escaping = false
      continue
    }
    if (ch === '\\') {
      escaping = true
      continue
    }
    if (ch === '|') {
      parts.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  parts.push(cur.trim())

  return parts
}

function applyInlineStylesToTextElement_(textElement, styles) {
  if (!textElement || !styles || styles.length === 0) return
  for (let i = 0; i < styles.length; i++) {
    const span = styles[i]
    const start = span.start
    const end = span.start + span.length - 1
    if (end < start) continue
    if (span.bold) textElement.setBold(start, end, true)
    if (span.italic) textElement.setItalic(start, end, true)
    if (span.underline) textElement.setUnderline(start, end, true)
    if (span.foregroundColor) textElement.setForegroundColor(start, end, span.foregroundColor)
    if (span.fontSize) textElement.setFontSize(start, end, Number(span.fontSize))
    if (span.backgroundColor) textElement.setBackgroundColor(start, end, span.backgroundColor)
  }
}

function containsMarkdownTableSyntax_(markdownText) {
  const lines = String(markdownText || '').split(/\r?\n/)
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\s*\|.*\|\s*$/.test(lines[i])) continue
    if (/^\s*\|\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|\s*$/.test(lines[i + 1])) {
      return true
    }
  }
  return false
}

function parseMarkdownDocumentForDocsApi_(markdownText) {
  const src = String(markdownText || '').replace(/\r\n/g, '\n')
  const srcLines = src.split('\n')
  const lines = []
  const outLines = []
  let offset = 0

  for (let i = 0; i < srcLines.length; i++) {
    const parsedLine = parseMarkdownLineForDocsApi_(srcLines[i])
    const nestingTabs = parsedLine.isList ? '\t'.repeat(parsedLine.nestingLevel || 0) : ''
    const lineText = nestingTabs + parsedLine.text
    lines.push({
      start: offset,
      text: lineText,
      headingLevel: parsedLine.headingLevel,
      isList: parsedLine.isList,
      listType: parsedLine.listType,
      styles: shiftStyles_(parsedLine.styles, nestingTabs.length),
      nestingLevel: parsedLine.nestingLevel || 0,
    })
    outLines.push(lineText)
    offset += lineText.length + 1
  }

  return {
    text: outLines.join('\n'),
    lines,
  }
}

function shiftStyles_(styles, offset) {
  const delta = Number(offset) || 0
  if (!styles || styles.length === 0 || delta === 0) return styles || []
  const out = []
  for (let i = 0; i < styles.length; i++) {
    const s = styles[i]
    const next = {}
    for (const key in s) next[key] = s[key]
    next.start = (Number(s.start) || 0) + delta
    out.push(next)
  }
  return out
}

function parseMarkdownLineForDocsApi_(line) {
  const headingInfo = parseHeadingFromLine_(line)
  if (headingInfo) {
    const inline = parseInlineMarkdownForDocsApi_(headingInfo.content)
    return {
      text: inline.text,
      styles: inline.styles,
      headingLevel: headingInfo.level,
      isList: false,
      listType: null,
    }
  }

  const unorderedMatch = /^\s*[-*+]\s+(.*)$/.exec(line)
  if (unorderedMatch) {
    const detailed = /^([ \t]*)[-*+]\s+(.*)$/.exec(line)
    const leading = detailed ? detailed[1] : ''
    const content = normalizeListMarkdownContent_(detailed ? detailed[2] : unorderedMatch[1])
    const inline = parseInlineMarkdownForDocsApi_(content)
    return {
      text: inline.text,
      styles: inline.styles,
      headingLevel: 0,
      isList: true,
      listType: 'unordered',
      nestingLevel: listNestingLevelFromLeading_(leading),
    }
  }

  const orderedMatch = /^\s*\d+\.\s+(.*)$/.exec(line)
  if (orderedMatch) {
    const detailed = /^([ \t]*)\d+\.\s+(.*)$/.exec(line)
    const leading = detailed ? detailed[1] : ''
    const content = normalizeListMarkdownContent_(detailed ? detailed[2] : orderedMatch[1])
    const inline = parseInlineMarkdownForDocsApi_(content)
    return {
      text: inline.text,
      styles: inline.styles,
      headingLevel: 0,
      isList: true,
      listType: 'ordered',
      nestingLevel: listNestingLevelFromLeading_(leading),
    }
  }

  const inline = parseInlineMarkdownForDocsApi_(line)
  return {
    text: inline.text,
    styles: inline.styles,
    headingLevel: 0,
    isList: false,
    listType: null,
    nestingLevel: 0,
  }
}

function parseHeadingFromLine_(line) {
  const text = String(line || '')

  const plain = /^\s{0,3}(#{1,4})\s+(.*)$/.exec(text)
  if (plain) {
    return {
      level: plain[1].length,
      content: plain[2],
    }
  }

  const escaped = /^\s{0,3}((?:\\#){1,4})\s+(.*)$/.exec(text)
  if (escaped) {
    const level = (escaped[1].match(/\\#/g) || []).length
    return {
      level: Math.max(1, Math.min(4, level)),
      content: escaped[2],
    }
  }

  return null
}

function normalizeListMarkdownContent_(content) {
  let text = String(content || '')
  let prev
  do {
    prev = text
    text = text.replace(/^\s*\\[*+-]\s+/, '')
    text = text.replace(/^\s*\\\d+\.\s+/, '')
    text = text.replace(/^\s*(?:\\#){1,4}\s+/, '')
    text = text.replace(/^\s*#{1,4}\s+/, '')
  } while (text !== prev)
  return text
}

function listNestingLevelFromLeading_(leading) {
  const text = String(leading || '')
  let level = 0
  let spaces = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i)
    if (ch === '\t') {
      level += 1
      spaces = 0
      continue
    }
    if (ch === ' ') {
      spaces += 1
      if (spaces >= 2) {
        level += 1
        spaces = 0
      }
    }
  }
  return level
}

function parseInlineMarkdownForDocsApi_(content) {
  let i = 0
  let plain = ''
  let bold = false
  let italic = false
  let underline = false
  let color = null
  let size = null
  let highlight = null
  let runStart = 0
  const styles = []

  function pushStyleSegment(endExclusive) {
    const length = endExclusive - runStart
    if (length <= 0) return
    if (!bold && !italic && !underline && !color && !size && !highlight) return
    const span = { start: runStart, length, bold, italic, underline }
    if (color) span.foregroundColor = color
    if (size) span.fontSize = size
    if (highlight) span.backgroundColor = highlight
    styles.push(span)
  }

  while (i < content.length) {
    if (content.startsWith('{/u}', i)) {
      pushStyleSegment(plain.length)
      runStart = plain.length
      underline = false
      i += 4
      continue
    }

    if (content.startsWith('{u}', i)) {
      pushStyleSegment(plain.length)
      runStart = plain.length
      underline = true
      i += 3
      continue
    }

    if (content.startsWith('{/color}', i)) {
      pushStyleSegment(plain.length)
      runStart = plain.length
      color = null
      i += 8
      continue
    }

    if (content.startsWith('{/size}', i)) {
      pushStyleSegment(plain.length)
      runStart = plain.length
      size = null
      i += 7
      continue
    }

    if (content.startsWith('{/highlight}', i)) {
      pushStyleSegment(plain.length)
      runStart = plain.length
      highlight = null
      i += 12
      continue
    }

    const colorOpen = /^\{color:\s*(#[0-9a-fA-F]{6})\}/.exec(content.substring(i))
    if (colorOpen) {
      pushStyleSegment(plain.length)
      runStart = plain.length
      color = colorOpen[1].toLowerCase()
      i += colorOpen[0].length
      continue
    }

    const sizeOpen = /^\{size:\s*(\d{1,3})\}/.exec(content.substring(i))
    if (sizeOpen) {
      pushStyleSegment(plain.length)
      runStart = plain.length
      size = Math.max(1, Math.min(200, Number(sizeOpen[1]) || 11))
      i += sizeOpen[0].length
      continue
    }

    const highlightOpen = /^\{highlight:\s*(#[0-9a-fA-F]{6})\}/.exec(content.substring(i))
    if (highlightOpen) {
      pushStyleSegment(plain.length)
      runStart = plain.length
      highlight = highlightOpen[1].toLowerCase()
      i += highlightOpen[0].length
      continue
    }

    const ch = content.charAt(i)
    const next = content.charAt(i + 1)

    if (
      ch === '\\' &&
      (next === '*' ||
        next === '\\' ||
        next === '{' ||
        next === '}' ||
        next === '#' ||
        next === '+' ||
        next === '-' ||
        next === '.' ||
        next === '[' ||
        next === ']' ||
        next === '(' ||
        next === ')' ||
        next === '_' ||
        next === '`')
    ) {
      plain += next
      i += 2
      continue
    }

    if (ch === '*' && next === '*') {
      pushStyleSegment(plain.length)
      runStart = plain.length
      bold = !bold
      i += 2
      continue
    }

    if (ch === '*') {
      pushStyleSegment(plain.length)
      runStart = plain.length
      italic = !italic
      i += 1
      continue
    }

    plain += ch
    i += 1
  }

  pushStyleSegment(plain.length)
  return { text: plain, styles }
}

function hexToRgbColor_(hex) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || '').trim())
  if (!m) return null
  const raw = m[1]
  return {
    red: parseInt(raw.substring(0, 2), 16) / 255,
    green: parseInt(raw.substring(2, 4), 16) / 255,
    blue: parseInt(raw.substring(4, 6), 16) / 255,
  }
}

function clearDocumentViaDocsApi_(documentId, tabContext) {
  const context = tabContext || resolveDocTabContext_(docsApiGetDocument_(documentId, true))
  const content = context.content || []
  const last = content.length > 0 ? content[content.length - 1] : null
  const endIndex = last && last.endIndex ? last.endIndex : 1

  if (endIndex > 2) {
    const range = {
      startIndex: 1,
      endIndex: endIndex - 1,
    }
    if (context.requestTabId) range.tabId = context.requestTabId

    docsApiBatchUpdate_(documentId, [
      {
        deleteContentRange: {
          range,
        },
      },
    ])
  }
}

function docsApiGetDocument_(documentId, includeTabsContent) {
  const query = includeTabsContent ? '?includeTabsContent=true' : ''
  return docsApiRequest_('get', 'documents/' + encodeURIComponent(documentId) + query)
}

function docsApiBatchUpdate_(documentId, requests) {
  return docsApiRequest_('post', 'documents/' + encodeURIComponent(documentId) + ':batchUpdate', { requests })
}

function docsApiRequest_(method, path, payload) {
  const url = 'https://docs.googleapis.com/v1/' + path
  const params = {
    method: String(method || 'get').toUpperCase(),
    headers: {
      authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
    },
    muteHttpExceptions: true,
  }

  if (payload !== undefined) {
    params.contentType = 'application/json'
    params.payload = JSON.stringify(payload)
  }

  const response = UrlFetchApp.fetch(url, params)
  const status = response.getResponseCode()
  const body = response.getContentText() || ''

  if (status < 200 || status >= 300) {
    throw new Error('Docs API request failed (' + status + '): ' + body)
  }

  if (!body) return {}
  try {
    return JSON.parse(body)
  } catch (_) {
    return {}
  }
}

function applyPatchToText_(text, patch, dmp) {
  const patches = dmp.patch_fromText(patch)
  const result = dmp.patch_apply(patches, text)
  return [result[0], patches, result[1]]
}

function getFiles(limit=10){
  limit = Math.max(0, Number(limit) || 0)
  if (limit === 0) return []

  const iterator = DriveApp.getFilesByType("application/vnd.google-apps.document")
  const top = []

  while (iterator.hasNext()) {
    const file = iterator.next()
    const updated = file.getLastUpdated().getTime()

    if (top.length < limit) {
      top.push({ file, updated })
      continue
    }

    // Keep only the most recent N files.
    let oldestIndex = 0
    for (let i = 1; i < top.length; i++) {
      if (top[i].updated < top[oldestIndex].updated) oldestIndex = i
    }

    if (updated > top[oldestIndex].updated) {
      top[oldestIndex] = { file, updated }
    }
  }

  top.sort((a, b) => b.updated - a.updated)
  return top.map((entry) => ({
    id: entry.file.getId(),
    name: entry.file.getName(),
    url: entry.file.getUrl(),
    lastUpdatedMs: entry.updated,
    lastUpdatedIso: entry.file.getLastUpdated().toISOString(),
  }))
}

function searchFiles(params, limit = 10) {
  limit = Math.max(0, Number(limit) || 0)
  if (limit === 0) return []

  const query = normalizeDriveQuery_(params)
  const iterator = DriveApp.searchFiles(query)
  const files = []

  while (iterator.hasNext() && files.length < limit) {
    const file = iterator.next()
    const updated = file.getLastUpdated()
    files.push({
      id: file.getId(),
      name: file.getName(),
      url: file.getUrl(),
      lastUpdatedMs: updated.getTime(),
      lastUpdatedIso: updated.toISOString(),
    })
  }

  return files
}

function normalizeDriveQuery_(params) {
  if (typeof params !== 'string' || params.trim() === '') {
    throw new Error('searchFiles(params): params must be a non-empty string')
  }

  const query = params.trim()

  // If caller already passed a Drive query, use it as-is.
  const looksLikeQuery = /(\btitle\b|\bmodifiedDate\b|\bmimeType\b|\btrashed\b|\bowners\b|\band\b|\bor\b|[<>=])/i.test(query)
  if (looksLikeQuery) return query

  // Otherwise treat input as a plain title search term.
  const escaped = query.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `title contains "${escaped}" and trashed = false`
}

function applyPatch(doctext, patch, dmp) {
  let text = doctext.getText()
  let patches = dmp.patch_fromText(patch)
  let [text2, results] = dmp.patch_apply(patches, text)

  // Apply minimal text edits so untouched ranges keep their original styles.
  let diffs = dmp.diff_main(text, text2, false)
  applyDiffsPreservingStyles(doctext, diffs)

  return [text2, patches, results]
}

function applyUnifiedPatch(doctext, patchText, dmp) {
  const text = doctext.getText()
  const hunks = parseUnifiedHunks_(patchText)
  const [targetText, results] = applyUnifiedHunksToText_(text, hunks)
  const dmpApplied = applyTextTransitionWithDmpToDocument_(doctext, text, targetText, dmp)

  return [dmpApplied.text, hunks, results, dmpApplied.results]
}

function applyTextTransitionWithDmpString_(fromText, toText, dmp) {
  const patches = dmp.patch_make(fromText, toText)
  const applied = dmp.patch_apply(patches, fromText)
  return { text: applied[0], results: applied[1] }
}

function applyTextTransitionWithDmpToDocument_(doctext, fromText, toText, dmp) {
  const applied = applyTextTransitionWithDmpString_(fromText, toText, dmp)
  const diffs = dmp.diff_main(fromText, applied.text, false)
  applyDiffsPreservingStyles(doctext, diffs)
  return applied
}

function parseUnifiedHunks_(patchText) {
  const lines = String(patchText).split(/\r?\n/)
  const hunks = []
  let i = 0

  while (i < lines.length) {
    const header = lines[i]
    const m = /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/.exec(header)
    if (!m) {
      i++
      continue
    }

    const oldStart = Number(m[1])
    const oldLen = m[2] ? Number(m[2]) : 1
    const newStart = Number(m[3])
    const newLen = m[4] ? Number(m[4]) : 1
    i++

    const hunkLines = []
    while (i < lines.length && !lines[i].startsWith('@@ ')) {
      const line = lines[i]
      const tag = line.charAt(0)
      if (tag === ' ' || tag === '+' || tag === '-') {
        const encoded = line.substring(1)
        let content = encoded
        try {
          content = decodeURI(encoded)
        } catch (_) {
          content = encoded
        }
        hunkLines.push({ tag, content })
      }
      i++
    }

    hunks.push({ oldStart, oldLen, newStart, newLen, lines: hunkLines })
  }

  return hunks
}

function applyUnifiedHunksToText_(text, hunks) {
  const lineData = splitTextLines_(text)
  const lines = lineData.lines.slice()
  let offset = 0
  const results = []

  for (let h = 0; h < hunks.length; h++) {
    const hunk = hunks[h]
    const oldSeq = hunk.lines.filter((x) => x.tag !== '+').map((x) => x.content)
    const newSeq = hunk.lines.filter((x) => x.tag !== '-').map((x) => x.content)

    let at = Math.max(0, hunk.oldStart - 1 + offset)
    if (!linesMatchAt_(lines, at, oldSeq)) {
      at = findNearbyMatch_(lines, oldSeq, at, 200)
    }

    if (at < 0) {
      results.push(false)
      continue
    }

    lines.splice(at, oldSeq.length, ...newSeq)
    offset += newSeq.length - oldSeq.length
    results.push(true)
  }

  let text2 = lines.join('\n')
  if (lineData.trailingNewline) text2 += '\n'
  return [text2, results]
}

function splitTextLines_(text) {
  const trailingNewline = text.endsWith('\n')
  const lines = text.split('\n')
  if (trailingNewline) lines.pop()
  return { lines, trailingNewline }
}

function linesMatchAt_(allLines, index, seq) {
  if (index < 0 || index + seq.length > allLines.length) return false
  for (let i = 0; i < seq.length; i++) {
    if (allLines[index + i] !== seq[i]) return false
  }
  return true
}

function findNearbyMatch_(allLines, seq, hintIndex, windowSize) {
  const start = Math.max(0, hintIndex - windowSize)
  const end = Math.min(allLines.length - seq.length, hintIndex + windowSize)
  for (let i = start; i <= end; i++) {
    if (linesMatchAt_(allLines, i, seq)) return i
  }
  return -1
}

function applyDiffsPreservingStyles(doctext, diffs) {
  let index = 0
  let ops = []

  for (let i = 0; i < diffs.length; i++) {
    let diff = diffs[i]
    let op = diff[0]
    let chunk = diff[1]
    if (!chunk) continue

    if (op === DIFF_EQUAL) {
      index += chunk.length
    } else if (op === DIFF_DELETE) {
      ops.push({ type: 'delete', start: index, end: index + chunk.length - 1 })
      index += chunk.length
    } else if (op === DIFF_INSERT) {
      ops.push({ type: 'insert', start: index, text: chunk })
    }
  }

  for (let i = ops.length - 1; i >= 0; i--) {
    let op = ops[i]

    if (op.type === 'delete') {
      doctext.deleteText(op.start, op.end)
      continue
    }

    let attrs = getInsertAttributes(doctext, op.start)
    doctext.insertText(op.start, op.text)
    if (attrs) {
      doctext.setAttributes(op.start, op.start + op.text.length - 1, attrs)
    }
  }
}

function getInsertAttributes(doctext, insertionIndex) {
  let length = doctext.getText().length
  if (length === 0) return null
  if (insertionIndex > 0) return doctext.getAttributes(insertionIndex - 1)
  return doctext.getAttributes(0)
}