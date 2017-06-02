import React, { Component } from 'react'
import { AppRegistry, Animated, Easing, View, StyleSheet, Image, Dimensions, ScrollView, TouchableOpacity } from 'react-native'

const deviceWidth = Dimensions.get('window').width
const deviceHeight = Dimensions.get('window').height
const DISMISS_MODAL_THRESHOLD = 150 //distance we have to scroll in the y direction to dismiss the carousel

// const images = [
//   'https://s-media-cache-ak0.pinimg.com/originals/ee/51/39/ee5139157407967591081ee04723259a.png',
//   'https://s-media-cache-ak0.pinimg.com/originals/40/4f/83/404f83e93175630e77bc29b3fe727cbe.jpg',
//   'https://s-media-cache-ak0.pinimg.com/originals/8d/1a/da/8d1adab145a2d606c85e339873b9bb0e.jpg',
// ]

const images = [
  require('./assets/images/image01.jpg'),
  require('./assets/images/image02.jpg'),
  require('./assets/images/image03.jpg'),
]

class ZoomView extends Component {

  static defaultProps = {
    doAnimateZoomReset: false,
    maximumZoomScale: 2,
    minimumZoomScale: 1,
    zoomed: false,
    zoomEnabled: false,
    zoomHeight: deviceHeight,
    zoomWidth: deviceWidth,
  }

  state = {
    startY: null, //y position of touch when we start scrolling on zoom view 
  }

  componentDidUpdate(prevProps) {
    if (prevProps.zoomed === true && this.props.zoomed === false) { //make sure we are scrolled to top
      this.handleResetZoomScale()
    }
  }

  setZoomRef = node => {
    if (node) {

      this.zoomRef = node
      this.scrollResponderRef = this.zoomRef.getScrollResponder()

      this.scrollResponderRef.scrollResponderHandleTouchStart = (event) => {
        const isZoom = event.nativeEvent.touches.length > 1 ? true : false

        if (!this.props.zoomed) {
          this.setState({ startY: event.nativeEvent.locationY })
        }

        if (isZoom) {
          if (!this.props.zoomed) {
            this.props.onZoomed()
          }
        }
      }

      this.scrollResponderRef.scrollResponderHandleTouchEnd = (event) => {
        if (this.props.zoomed) {
          return
        }
        const currentY = event.nativeEvent.locationY
        const scrollYDistance = Math.abs(this.state.startY - currentY)
        //if we have swiped further up or down than the threshold distance and we're not zooming on an image, dismiss the isolated carousel mode
        if (scrollYDistance > DISMISS_MODAL_THRESHOLD) {
          this.props.onZoomClosePress()
        }
      }
    }
  }

  handleZoomViewPress = () => {
    if (!this.props.zoomEnabled) {
      this.props.onZoomEnabled()
    }
    else {
      if (this.props.zoomed) {
        this.handleResetZoomScale()
        this.props.onZoomClosePress()
      }
    }
  }

  handleResetZoomScale = () => {
    this.scrollResponderRef.scrollResponderZoomTo({ x: 0, y: 0, width: this.props.zoomWidth, height: this.props.zoomHeight, animated: true })
  }

  render() {
    return (
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        centerContent //centers content when zoom is less than scroll view bounds 
        maximumZoomScale={this.props.zoomEnabled ? this.props.maximumZoomScale : 1} //setting to 1 disallows zoom
        minimumZoomScale={this.props.minimumZoomScale}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        ref={this.setZoomRef}
        //scrollEnabled={this.props.zoomEnabled} //prevents you from panning on image
        scrollEventThrottle={20}
        style={{
          overflow: 'visible',
          height: 219,
        }}
      >
        <TouchableOpacity
          onPress={this.handleZoomViewPress}
        >
          <Image
            source={this.props.source}
            //ratioGrow
            style={{
              overflow: 'visible',
              width: deviceWidth
            }}
          />
        </TouchableOpacity>
      </ScrollView>
    )
  }
}

AppRegistry.registerComponent('ZoomView', () => ZoomView);


export default class App extends Component {

  //ZOOM VIEW
  animZoomVal = new Animated.Value(0)

  animValUpTiming = Animated.timing(this.animZoomVal, {
    toValue: 1,
    duraton: 300,
    easing: Easing.inOut(Easing.quad),
  })
  animValDownTiming = Animated.timing(this.animZoomVal, {
    toValue: 0,
    duraton: 300,
    easing: Easing.inOut(Easing.quad),
  })
  animTranslateY = this.animZoomVal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150],
  })

  //SCROLLBAR
  animScrollBarOpacityVal = new Animated.Value(1)
  animScrollOpacityUpTiming = Animated.timing(this.animScrollBarOpacityVal, {
    toValue: 1,
    duraton: 300,
    easing: Easing.inOut(Easing.quad),
  })
  animScrollOpacityDownTiming = Animated.timing(this.animScrollBarOpacityVal, {
    toValue: 0,
    duraton: 300,
    easing: Easing.inOut(Easing.quad),
  })

  //CLOSE BUTTON
  animCloseOpacityVal = new Animated.Value(0)
  animCloseOpacityUpTiming = Animated.timing(this.animCloseOpacityVal, {
    toValue: 1,
    duraton: 300,
    easing: Easing.inOut(Easing.quad),
  })
  animCloseOpacityDownTiming = Animated.timing(this.animCloseOpacityVal, {
    toValue: 0,
    duraton: 300,
    easing: Easing.inOut(Easing.quad),
  })

  animScrollXVal = new Animated.Value(0)

  // To get clamp to work on the right edge we have to clamp using the indicator's left position
  scrollXVal = this.animScrollXVal.interpolate({
    inputRange: [0, deviceWidth * (images.length - 1)],
    outputRange: [0, (deviceWidth / images.length) * (images.length - 1)],
    extrapolate: 'clamp',
  })

  state = {
    scrollEnabled: true,
    zoomEnabled: false,
    zoomed: false,
  }

  handleZoomEnabled = () => {
    this.setState({ zoomEnabled: true })
    this.animValUpTiming.start()
    this.animCloseOpacityUpTiming.start()
  }

  handleZoomed = () => {
    this.setState({ zoomed: true })
    this.animScrollOpacityDownTiming.start()
    this.animCloseOpacityDownTiming.start()
  }

  handleZoomClosePress = () => {
    if (this.state.zoomEnabled) {
      this.animScrollOpacityUpTiming.start()
      this.setState({ zoomEnabled: false, zoomed: false })
      this.animValDownTiming.start()
      this.animCloseOpacityDownTiming.start()
    }
  }

  renderSliderImage = (image, i) => {
    return (
      <ZoomView
        key={i}
        source={image}
        zoomEnabled={this.state.zoomEnabled}
        zoomed={this.state.zoomed}
        onZoomEnabled={this.handleZoomEnabled}
        onZoomClosePress={this.handleZoomClosePress}
        onZoomed={this.handleZoomed}
        index={i}
      />
    )
  }

  render() {

    return (
      <View
        style={styles.container}
      >
        <Animated.View
          style={{
            transform: [
              { translateY: this.animTranslateY },
            ],
            height: 219,
          }}
        >
          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={20}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: this.animScrollXVal } } }]
            )}
            scrollEnabled={this.state.scrollEnabled}
            style={{
              overflow: 'visible',

            }}
          >
            {
              images.map((image, i) => {
                return (this.renderSliderImage(image, i))
              })
            }
          </Animated.ScrollView>
          <Animated.View
            style={{
              width: deviceWidth,
              height: 5,
            }}
          >

            <Animated.View
              style={{
                backgroundColor: '#E5E5E5',
                opacity: this.animScrollBarOpacityVal,
              }}
            >
              <Animated.View
                style={{
                  backgroundColor: '#111111',
                  width: deviceWidth / images.length,
                  height: 5,
                  marginHorizontal: -0.1,
                  transform: [
                    {
                      translateX: this.scrollXVal,
                    },
                  ]
                }}
              />
            </Animated.View>
          </Animated.View>
        </Animated.View>
        {
          this.state.zoomEnabled &&
          (
            <Animated.View
              style={{
                position: 'absolute',
                top: 44,
                right: 20,
                opacity: this.animCloseOpacityVal,
              }}
            >
              <TouchableOpacity
                onPress={this.handleZoomClosePress}
              >
                <Image
                  source={require('./assets/images/close.png')}
                />
              </TouchableOpacity>
            </Animated.View>
          )
        }
      </View>

    )
  }
}

AppRegistry.registerComponent('App', () => App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 40,
  },
})