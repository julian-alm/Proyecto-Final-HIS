using System.Collections;
namespace Ejercicio_Array
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }
        ArrayList lista = new ArrayList();
        private void label6_Click(object sender, EventArgs e)
        {

        }

        private void Form1_Load(object sender, EventArgs e)
        {

        }

        private void button1_Click(object sender, EventArgs e)
        {
            if (comboBox1.SelectedIndex == 1)
            {
                Vehiculo NuevoAuto = new Auto(textBox1.Text, textBox2.Text, textBox3.Text, int.Parse(textBox4.Text));
                lista.Add(NuevoAuto);
                dataGridView1.Rows.Add(NuevoAuto.Patente, NuevoAuto.Marca, NuevoAuto.Modelo);
            }
            else if (comboBox1.SelectedIndex == 2)
            {
                Vehiculo NuevaMoto = new Moto(textBox1.Text, textBox2.Text, textBox3.Text, int.Parse(textBox5.Text));
                lista.Add(NuevaMoto);
                dataGridView1.Rows.Add(NuevaMoto.Patente, NuevaMoto.Marca, NuevaMoto.Modelo);
            }

            comboBox1.SelectedIndex = 0;
            textBox1.Text = "";
            textBox2.Text = string.Empty;
            textBox3.Text = string.Empty;
            textBox4.Text = string.Empty;
            textBox5.Text = string.Empty;
        }

        private void button2_Click(object sender, EventArgs e)
        {
            if (dataGridView1.CurrentRow == null)
            {
                MessageBox.Show("Debe seleccionar una fila");
            }

            int index = dataGridView1.CurrentRow.Index;
            Vehiculo v = (Vehiculo)lista[index]; 

            
            v.Patente = textBox1.Text;
            v.Marca = textBox2.Text;
            v.Modelo = textBox3.Text;

           
            if (v.GetType().Name == "Auto") 
            {
                ((Auto)v).CantidadPuertas = int.Parse(textBox4.Text);
                dataGridView1.Rows[index].SetValues(v.Patente, v.Marca, v.Modelo, ((Auto)v).CantidadPuertas);
            }
            else if (v.GetType().Name == "Moto") 
            {
                ((Moto)v).cilindrada = int.Parse(textBox5.Text);
                dataGridView1.Rows[index].SetValues(v.Patente, v.Marca, v.Modelo, ((Moto)v).cilindrada);
            }
        }

        private void button3_Click(object sender, EventArgs e)
        {
            if (dataGridView1.CurrentRow == null)
            {
                MessageBox.Show("Debe seleccionar una fila");
            }

            int index = dataGridView1.CurrentRow.Index;
            lista.RemoveAt(index);
            dataGridView1.Rows.RemoveAt(index);
        }

        private void button4_Click(object sender, EventArgs e)
        {
            string patenteBuscada = textBox1.Text.Trim();

            if (patenteBuscada == "")
            {
                MessageBox.Show("Ingrese una patente para buscar.");
                return;
            }
            bool encontrado = false;

            // Recorremos el ArrayList
            for (int i = 0; i < lista.Count; i++)
            {
                Vehiculo v = (Vehiculo)lista[i]; // casteamos porque es ArrayList

                if (v.Patente == patenteBuscada)
                {
                    MessageBox.Show(v.MostrarDatos(), "Vehículo encontrado");
                    encontrado = true;
                    break; // salimos del bucle porque ya encontramos la patente
                }
            }

            if (!encontrado)
            {
                MessageBox.Show("No se encontró ningún vehículo con esa patente.");
            }
        }
    }


    public abstract class Vehiculo
    {
        public string Patente { get; set; }
        public string Marca { get; set; }
        public string Modelo { get; set; }

        public Vehiculo(string _patente, string _marca, string _modelo)
        {
            Patente = _patente;
            Marca = _marca;
            Modelo = _modelo;
        }

        public abstract string MostrarDatos();
    }

    public class Auto : Vehiculo
    {
        public int CantidadPuertas { get; set; }

        public Auto(string patente, string marca, string modelo, int _cantidadPuertas) : base(patente, marca, modelo)
        {
            CantidadPuertas = _cantidadPuertas;
        }
        public override string MostrarDatos()
        {
            return $"El auto es de la marca  {Marca} y su modelo es {Modelo}, al que le corresponde la patente {Patente} y tiene esta cantidad de puertas  {CantidadPuertas} ";

        }
    }

    public class Moto : Vehiculo
    {
        public int cilindrada { get; set; }

        public Moto(string patente, string marca, string modelo, int _cilindrada) : base(patente, marca, modelo)
        {
            cilindrada = _cilindrada;
        }

        public override string MostrarDatos()
        {
            return $"[Moto] {Patente} - {Marca} {Modelo}, Cilindrada: {cilindrada}cc";
        }

    }
}
