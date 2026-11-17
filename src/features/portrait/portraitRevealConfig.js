/** Reference sizes/rates follow the supplied CodePen; costs are explicitly bounded. */
export const portraitRevealConfig={
 respectReducedMotion:false,
 pencilImage:'/images/closeup-profile-pencil.png',
 // Common uncropped artwork frame: the original photograph's aspect ratio.
 frame:{width:1018,height:1544},
 maxDpr:1.5,fps:30,segments:320,largeBlobSegments:32,
 growth:.12,growthRate:.005,opacityRate:.00012,
 gradientInnerStop:.68,gradientOuterStop:.975,
 blobJitterLarge:.05,blobJitterSmall:.08,jitterChange:-.03,
 // Narrow angular tips remain visible after the initial growth has settled.
 contour:{spikes:80,minExtension:.04,maxExtension:.18,retention:.8,edgeOpacity:.4,edgeFeather:.6},
 // Reference radii are scaled with the portrait; satellites never spawn satellites.
 satellites:{enabled:true,chance:.4,threshold:40,minCount:2,maxCount:4,minScale:.12,maxScale:.24,minRadius:3,maxRadius:14,minDistance:1.35,maxDistance:1.9},
 hoverScale:1.5,rampDuration:1000,
 hoverDrops:{interval:40,revealBothChance:.6},
 pressure:{enabled:true,startAt:.65,rampMs:500,holdAcceleration:8,fadeAcceleration:10,reserve:8,retireMs:180},
 smear:{duration:650,minTravel:24,maxTravel:56,trailFactor:.5},
 drizzle:{minRadius:6,maxRadius:60,life:2500,interval:100,initialInterval:90,hoverInterval:32,intervalVariance:600,maxDistance:280,limit:80,initial:8},
 cluster:{minRadius:6,maxRadius:60,life:8000,interval:100,initialInterval:48,hoverInterval:55,intervalVariance:600,centerSpread:60,safeMargin:24,limit:64,initial:20},
};
