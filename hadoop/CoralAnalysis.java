import java.io.IOException;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.*;
import org.apache.hadoop.mapreduce.*;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class CoralAnalysis {

    public static class CoralMapper
        extends Mapper<LongWritable, Text, Text, Text> {

        private Text site = new Text();
        private Text output = new Text();

        public void map(LongWritable key, Text value, Context context)
                throws IOException, InterruptedException {

            String line = value.toString().trim();

            if (line.isEmpty() || line.startsWith("year,")) {
                return;
            }

            // Expected input: coral_cleaned.csv
            String[] fields = line.split(",", -1);

            if (fields.length < 15) {
                return;
            }

            try {
                String siteName = fields[3].trim();
                double temperature = Double.parseDouble(fields[7].trim());
                double bleaching = Double.parseDouble(fields[14].trim());

                if (siteName.isEmpty() ||
                    !Double.isFinite(temperature) ||
                    !Double.isFinite(bleaching)) {
                    return;
                }

                site.set(siteName);
                output.set(temperature + "," + bleaching);

                context.write(site, output);

            } catch (NumberFormatException e) {
                // Skip records with invalid numeric values.
            }
        }
    }

    public static class CoralReducer
        extends Reducer<Text, Text, Text, Text> {

        public void reduce(Text key, Iterable<Text> values,
                           Context context)
                throws IOException, InterruptedException {

            double totalTemperature = 0;
            double totalBleaching = 0;
            long count = 0;

            for (Text value : values) {

                String[] numbers = value.toString().split(",");

                totalTemperature += Double.parseDouble(numbers[0]);
                totalBleaching += Double.parseDouble(numbers[1]);

                count++;
            }

            if (count > 0) {

                double avgTemperature = totalTemperature / count;
                double avgBleaching = totalBleaching / count;

                String result = String.format(
                    java.util.Locale.US,
                    "%.4f,%.4f,%d",
                    avgTemperature,
                    avgBleaching,
                    count
                );

                context.write(key, new Text(result));
            }
        }
    }

    public static void main(String[] args) throws Exception {

        if (args.length != 2) {
            System.err.println(
                "Usage: CoralAnalysis <input> <output>"
            );
            System.exit(2);
        }

        Configuration conf = new Configuration();

        Job job = Job.getInstance(conf, "ORCA Coral Analysis");

        job.setJarByClass(CoralAnalysis.class);

        job.setMapperClass(CoralMapper.class);
        job.setReducerClass(CoralReducer.class);

        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(Text.class);

        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(Text.class);

        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));

        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}
























































