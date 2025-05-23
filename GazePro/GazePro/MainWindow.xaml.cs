using System.Collections.ObjectModel;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using System.Windows.Threading;

namespace GazePro
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public List<string> Categories { get; set; }
        public ObservableCollection<object> SessionPlaceholders { get; set; }

        public MainWindow()
        {
            InitializeComponent();

            Categories = new List<string> { "Match", "Training", "Highlight", "Practice", "Goal" };
            SessionPlaceholders = new ObservableCollection<object>();
            SessionCategoryList.ItemsSource = SessionPlaceholders;

            DataContext = this;

            TimelineSelector.PositionChanged += position =>
            {
                VideoPlayer.Position = position;
            };
        }

        private void UploadArea_Click(object sender, MouseButtonEventArgs e)
        {
            var openFileDialog = new Microsoft.Win32.OpenFileDialog
            {
                Filter = "Video files (*.mp4;*.mov;*.avi)|*.mp4;*.mov;*.avi"
            };

            if (openFileDialog.ShowDialog() == true)
            {
                UploadPrompt.Visibility = Visibility.Collapsed;
                VideoPlayer.Source = new Uri(openFileDialog.FileName);
                VideoPlayer.Visibility = Visibility.Visible;

                VideoPlayer.MediaOpened += (s, args) =>
                {
                    TimelineSelector.SetVideoDuration(VideoPlayer.NaturalDuration.TimeSpan);

                    DispatcherTimer timer = new DispatcherTimer
                    {
                        Interval = TimeSpan.FromMilliseconds(200)
                    };
                    timer.Tick += (o, e) =>
                    {
                        if (VideoPlayer.NaturalDuration.HasTimeSpan)
                        {
                            TimelineSelector.SetPosition(VideoPlayer.Position);
                        }
                    };
                    timer.Start();
                };

                VideoPlayer.Play();
            }
        }

        private void Play_Click(object sender, RoutedEventArgs e) => VideoPlayer.Play();
        private void Pause_Click(object sender, RoutedEventArgs e) => VideoPlayer.Pause();
        private void Rewind_Click(object sender, RoutedEventArgs e) => VideoPlayer.Position -= TimeSpan.FromSeconds(10);
        private void Forward_Click(object sender, RoutedEventArgs e) => VideoPlayer.Position += TimeSpan.FromSeconds(30);

        private void Flag_Click(object sender, RoutedEventArgs e)
        {
            TimelineSelector.FlagCurrentPosition();

            MessageBox.Show("Segment flagged. Cut-out range displayed on timeline.");
        }

        private void CreateCutoutButton_Click(object sender, RoutedEventArgs e)
        {

        }

        private void SaveCutVideo_Click(object sender, RoutedEventArgs e)
        {
            var selectedCategories = CategoryComboBox.SelectedItems.Cast<string>().ToList();
            var cutName = CutVideoName.Text;

            MessageBox.Show($"Saving '{cutName}' with categories: {string.Join(", ", selectedCategories)}");

            // TODO: Save logic
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {

        }

        private void SessionsBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            if (int.TryParse(SessionsBox.Text, out int sessionCount))
            {
                SessionPlaceholders.Clear();
                for (int i = 0; i < sessionCount; i++)
                {
                    SessionPlaceholders.Add(new object());
                }
            }
        }

        private void CreateTraining_Click(object sender, RoutedEventArgs e)
        {
            MessageBox.Show("Training session created!");
            // Logic for saving or generating training could go here
        }
    }
}