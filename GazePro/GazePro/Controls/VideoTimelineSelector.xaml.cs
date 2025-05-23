using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace GazePro.Controls
{
    /// <summary>
    /// Interaction logic for VideoTimelineSelector.xaml
    /// </summary>
    public partial class VideoTimelineSelector : UserControl
    {
        private double _timelineWidth;
        private TimeSpan _videoDuration = TimeSpan.Zero;
        private double _playheadX = 0;
        private double _startX = 0;
        private double _endX = 0;

        public event Action<TimeSpan>? PositionChanged;

        public VideoTimelineSelector()
        {
            InitializeComponent();
            Loaded += VideoTimelineSelector_Loaded;
        }

        private void VideoTimelineSelector_Loaded(object sender, RoutedEventArgs e)
        {
            _timelineWidth = RootGrid.ActualWidth;
            UpdateVisuals();
        }

        public void SetVideoDuration(TimeSpan duration)
        {
            _videoDuration = duration;
        }

        public void SetPosition(TimeSpan position)
        {
            if (_videoDuration == TimeSpan.Zero) return;
            _playheadX = _timelineWidth * position.TotalSeconds / _videoDuration.TotalSeconds;
            UpdateVisuals();
        }

        public void SetThumbnails(List<BitmapImage> thumbnails)
        {
            ThumbnailStrip.ItemsSource = thumbnails;
        }

        public void FlagCurrentPosition()
        {
            if (_videoDuration == TimeSpan.Zero) return;

            TimeSpan current = TimeSpan.FromSeconds(_playheadX / _timelineWidth * _videoDuration.TotalSeconds);
            TimeSpan start = current - TimeSpan.FromSeconds(10);
            TimeSpan end = current + TimeSpan.FromSeconds(10);

            if (start < TimeSpan.Zero) start = TimeSpan.Zero;
            if (end > _videoDuration) end = _videoDuration;

            _startX = start.TotalSeconds / _videoDuration.TotalSeconds * _timelineWidth;
            _endX = end.TotalSeconds / _videoDuration.TotalSeconds * _timelineWidth;

            StartThumb.Visibility = Visibility.Visible;
            EndThumb.Visibility = Visibility.Visible;
            CutoutRange.Visibility = Visibility.Visible;

            UpdateVisuals();
        }

        private void UpdateVisuals()
        {
            Canvas.SetLeft(Playhead, _playheadX);
            Canvas.SetLeft(StartThumb, _startX);
            Canvas.SetLeft(EndThumb, _endX);

            CutoutRange.Margin = new Thickness(_startX, 10, _timelineWidth - _endX, 0);
        }

        private void Playhead_DragDelta(object sender, DragDeltaEventArgs e)
        {
            _playheadX += e.HorizontalChange;
            _playheadX = Math.Max(0, Math.Min(_playheadX, _timelineWidth));
            UpdateVisuals();

            if (_videoDuration != TimeSpan.Zero)
            {
                TimeSpan newPosition = TimeSpan.FromSeconds(_playheadX / _timelineWidth * _videoDuration.TotalSeconds);
                PositionChanged?.Invoke(newPosition);
            }
        }

        private void StartThumb_DragDelta(object sender, DragDeltaEventArgs e)
        {
            _startX += e.HorizontalChange;
            _startX = Math.Max(0, Math.Min(_startX, _endX - 10));
            UpdateVisuals();
        }

        private void EndThumb_DragDelta(object sender, DragDeltaEventArgs e)
        {
            _endX += e.HorizontalChange;
            _endX = Math.Min(_timelineWidth, Math.Max(_endX, _startX + 10));
            UpdateVisuals();
        }
    }
}
